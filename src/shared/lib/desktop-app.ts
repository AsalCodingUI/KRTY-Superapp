"use client"

import { createClient } from "@/shared/api/supabase/client"

/**
 * Kretya Flow (the Mac app) from the web app's side: talking to its Rust
 * commands through `window.__TAURI__`, and its releases (an "Update
 * aplikasi" post in Aturan & Update with the version in its title, plus a
 * .dmg for that version in storage).
 */

/** Category of app update posts in Aturan & Update. */
export const APP_UPDATE_CATEGORY = "Update aplikasi"

export const RELEASE_BUCKET = "app-releases"
/** Which build: the Mac's (one universal .dmg) or Windows' (an x64
 *  installer). */
export type AppPlatform = "mac" | "windows"

/** Where a version's downloads live, one file per platform. */
export const releaseFolder = (version: string) => `kretya-flow/${version}`
export const releaseFile = (version: string, platform: AppPlatform = "mac") =>
  platform === "windows"
    ? `Kretya-Flow-${version}-x64-setup.exe`
    : `Kretya-Flow-${version}-universal.dmg`

/** This device's build: Windows on Windows, else the Mac's. */
export function devicePlatform(): AppPlatform {
  if (typeof navigator === "undefined") return "mac"
  return /Windows/.test(navigator.userAgent) ? "windows" : "mac"
}

type TauriGlobal = {
  app?: { getVersion: () => Promise<string> }
  event?: {
    listen: <T>(
      event: string,
      handler: (e: { payload: T }) => void,
    ) => Promise<() => void>
  }
  core: {
    invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
  }
}

export const tauri = () =>
  typeof window === "undefined"
    ? undefined
    : (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__

/** A Rust command; undefined outside the app or when it fails (an older
 *  build may not have it). */
export async function invokeApp<T = unknown>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T | undefined> {
  const t = tauri()
  if (!t) return undefined
  try {
    return (await t.core.invoke(cmd, args)) as T
  } catch {
    return undefined
  }
}

export type AppInfo = { name: string; version: string; identifier: string }

/** The running app's version (from Rust; builds before `app_info` answer
 *  through Tauri's own app API). */
export async function appInfo(): Promise<AppInfo | null> {
  const info = await invokeApp<AppInfo>("app_info")
  if (info?.version) return info
  const version = await tauri()
    ?.app?.getVersion()
    .catch(() => undefined)
  return version
    ? { name: "Kretya Flow", version, identifier: "com.kretyastudio.krty" }
    : null
}

/**
 * The app's in-place updater (0.2.0 and later; see desktop/src-tauri/src/
 * updater.rs): checked at launch and every 6 hours, downloaded in the
 * background, installed on "Restart".
 */
export type UpdatePhase =
  | "idle"
  | "checking"
  | "downloading"
  | "ready"
  | "upToDate"
  | "error"

export type UpdateStatus = {
  phase: UpdatePhase
  current: string
  version: string | null
  notes: string | null
  downloaded: number
  total: number | null
  /** Unix ms. */
  lastChecked: number | null
  errorKind: "network" | "signature" | "install" | "other" | null
  error: string | null
}

/** The updater's state; undefined outside the app or in a build without
 *  the updater (0.1.0: it updates through the .dmg). */
export const updateStatus = () => invokeApp<UpdateStatus>("update_status")

/** A check now (answers with "checking"; the rest comes as events). */
export const checkForUpdate = () => invokeApp<UpdateStatus>("update_check")

/** Installs the downloaded update and relaunches the app (answers only
 *  when that fails). */
export const installUpdate = () => invokeApp<UpdateStatus>("update_install")

/** Every change of the updater's state; returns the unsubscribe. */
export function onUpdateStatus(handler: (status: UpdateStatus) => void) {
  const listen = tauri()?.event?.listen
  if (!listen) return () => {}
  let stop: (() => void) | undefined
  let stopped = false
  void listen<UpdateStatus>("update-status", (e) => handler(e.payload))
    .then((unlisten) => {
      if (stopped) unlisten()
      else stop = unlisten
    })
    .catch(() => undefined)
  return () => {
    stopped = true
    stop?.()
  }
}

/** "0.1.10" > "0.1.9", piece by piece. */
export function isNewerVersion(a: string, b: string) {
  const pa = a.split(".").map(Number)
  const pb = b.split(".").map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++)
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0)
  return false
}

export type MacRelease = {
  version: string
  platform: AppPlatform
  /** The release notes: /policies?policy=<slug> (null: no post yet). */
  slug: string | null
  /** The .dmg (or Windows installer) in the releases bucket. */
  path: string
}

/**
 * The newest published app update that has a Mac download. Posts are
 * newest version first; the first one whose .dmg is uploaded wins (a post
 * can go out before its file).
 */
export async function fetchLatestMacRelease(
  platform: AppPlatform = devicePlatform(),
): Promise<MacRelease | null> {
  const supabase = createClient()
  const fileOf = (version: string) => releaseFile(version, platform)
  const { data } = await supabase
    .from("policy_documents")
    .select("slug, title")
    .eq("category", APP_UPDATE_CATEGORY)
    .is("archived_at", null)
    .not("current_version_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(20)
  const posts = ((data ?? []) as { slug: string; title: string }[])
    .map((d) => ({
      slug: d.slug,
      version: d.title.match(/\d+\.\d+\.\d+/)?.[0],
    }))
    .filter((d): d is { slug: string; version: string } => Boolean(d.version))
    .sort((a, b) => (isNewerVersion(a.version, b.version) ? -1 : 1))
  for (const post of posts.slice(0, 5)) {
    const { data: files } = await supabase.storage
      .from(RELEASE_BUCKET)
      .list(releaseFolder(post.version), { search: fileOf(post.version) })
    if (files?.some((f: { name: string }) => f.name === fileOf(post.version)))
      return {
        ...post,
        platform,
        path: `${releaseFolder(post.version)}/${fileOf(post.version)}`,
      }
  }
  // No post for it (yet): the highest version uploaded to the bucket, so a
  // .dmg put there is downloadable even before its release notes are out.
  const { data: folders } = await supabase.storage
    .from(RELEASE_BUCKET)
    .list("kretya-flow", { limit: 100 })
  const versions = ((folders ?? []) as { name: string }[])
    .map((f) => f.name)
    .filter((v) => /^\d+\.\d+\.\d+$/.test(v))
    .sort((a, b) => (isNewerVersion(a, b) ? -1 : 1))
  for (const version of versions.slice(0, 5)) {
    const { data: files } = await supabase.storage
      .from(RELEASE_BUCKET)
      .list(releaseFolder(version), { search: fileOf(version) })
    if (files?.some((f: { name: string }) => f.name === fileOf(version)))
      return {
        slug: null,
        version,
        platform,
        path: `${releaseFolder(version)}/${fileOf(version)}`,
      }
  }
  return null
}

/**
 * Starts the .dmg download: a short-lived signed link, opened in the
 * browser from the app (its window can't save files), in place on the web.
 */
export async function downloadMacRelease(release: MacRelease) {
  const { data, error } = await createClient()
    .storage.from(RELEASE_BUCKET)
    .createSignedUrl(release.path, 600, {
      download: releaseFile(release.version, release.platform),
    })
  if (error || !data) return false
  if (tauri()) await invokeApp("open_external", { url: data.signedUrl })
  else window.location.href = data.signedUrl
  return true
}

/** A Windows PC (not a phone): who the installer is for. */
export function isWindowsDesktop() {
  if (typeof navigator === "undefined") return false
  return (
    /Windows/.test(navigator.userAgent) &&
    window.matchMedia("(pointer: fine)").matches
  )
}

/** On the web: the app this computer can install, if any. */
export const downloadablePlatform = (): AppPlatform | null =>
  isWindowsDesktop() ? "windows" : isMacDesktop() ? "mac" : null

/** A Mac with a mouse (not an iPad, not a phone): who the .dmg is for. */
export function isMacDesktop() {
  if (typeof navigator === "undefined") return false
  const mac = /Macintosh|Mac OS X/.test(navigator.userAgent)
  const touch = navigator.maxTouchPoints > 1
  return mac && !touch && window.matchMedia("(pointer: fine)").matches
}
