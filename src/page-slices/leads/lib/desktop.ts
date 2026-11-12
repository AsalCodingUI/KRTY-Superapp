"use client"

import { tauri } from "@/shared/lib/desktop-app"

/**
 * Kretya Flow's lead web views (desktop/src-tauri/src/leads.rs): each site a
 * native web view laid over the page sheet. Outside the app (a browser, or
 * an app build before Leads) these do nothing.
 */
export const inApp = () => Boolean(tauri())

/** Shows `id` over `rect` (CSS pixels from the window's top left). True
 *  when the app did; false outside it or in a build without Leads. */
export async function showLead(
  id: string,
  url: string,
  rect: {
    x: number
    y: number
    width: number
    height: number
    /** The sheet's corner radius (px), and whether the left corners too. */
    radius?: number
    roundLeft?: boolean
  },
): Promise<boolean> {
  const t = tauri()
  if (!t) return false
  try {
    await t.core.invoke("lead_show", {
      id,
      url,
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      radius: rect.radius ?? 0,
      roundLeft: rect.roundLeft ?? false,
    })
    return true
  } catch {
    return false
  }
}

export async function hideLeads() {
  try {
    await tauri()?.core.invoke("lead_hide")
  } catch {}
}

export async function closeLead(id: string) {
  try {
    await tauri()?.core.invoke("lead_close", { id })
  } catch {}
}

/** The shown site takes the window's focus (hover and keys without a
 *  click). */
export async function focusLead(id: string) {
  try {
    await tauri()?.core.invoke("lead_focus", { id })
  } catch {}
}

/** A picture of the site as it is now (an object URL to a JPEG), to show
 *  in its place while it's hidden for an overlay; null when unavailable. */
export async function snapshotLead(id: string): Promise<string | null> {
  const t = tauri()
  if (!t) return null
  try {
    const bytes = (await t.core.invoke("lead_snapshot", { id })) as
      | ArrayBuffer
      | number[]
    const buffer =
      bytes instanceof ArrayBuffer ? bytes : new Uint8Array(bytes).buffer
    return URL.createObjectURL(new Blob([buffer], { type: "image/jpeg" }))
  } catch {
    return null
  }
}

/** The site's own back / forward / reload. */
export async function navLead(id: string, action: "back" | "forward" | "reload") {
  try {
    await tauri()?.core.invoke("lead_nav", { id, action })
  } catch {}
}

/** Where the site is now (null outside the app or before it's made). */
export async function leadUrl(id: string): Promise<string | null> {
  try {
    return ((await tauri()?.core.invoke("lead_url", { id })) as string | null) ?? null
  } catch {
    return null
  }
}
