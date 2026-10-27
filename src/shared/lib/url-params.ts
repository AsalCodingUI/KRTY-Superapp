/**
 * URL convention: paths and query params in English, one name per idea
 * (`?period=2026-Q4`, `?project=`, `?member=`, `?contract=`, `?client=`,
 * `?policy=`, `?task=`, `?report=`). Older links (notifications, bookmarks)
 * used Indonesian names; the middleware renames those on the way in.
 */
export const LEGACY_QUERY_PARAMS: Record<string, string> = {
  periode: "period",
  quarter: "period",
  proyek: "project",
  anggota: "member",
  dari: "from",
  kontrak: "contract",
  klien: "client",
  aturan: "policy",
  untuk: "for",
}

/** Portal pages called the open report `?r=`. */
export const LEGACY_PORTAL_PARAMS: Record<string, string> = { r: "report" }

/**
 * The same URL with legacy param names renamed, or null when there were
 * none (a param already given under its new name wins).
 */
export function renameLegacyParams(url: URL): URL | null {
  const names = {
    ...LEGACY_QUERY_PARAMS,
    ...(url.pathname.startsWith("/p/") ? LEGACY_PORTAL_PARAMS : {}),
  }
  let changed = false
  const next = new URL(url)
  for (const [old, name] of Object.entries(names)) {
    const value = next.searchParams.get(old)
    if (value === null) continue
    next.searchParams.delete(old)
    if (!next.searchParams.has(name)) next.searchParams.set(name, value)
    changed = true
  }
  return changed ? next : null
}

/** A name as it reads in a URL: "Brand Kit — QA" → "brand-kit-qa". */
export function urlSlug(name: string | null | undefined, fallback = "item") {
  return (
    (name ?? "")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/g, "") || fallback
  )
}

/**
 * The key a link uses for a row (`?task=desain-logo-3f9a1c2b`): its name,
 * then the first 8 characters of its id, which is what finds it again.
 */
export function linkKey(name: string | null | undefined, id: string) {
  return `${urlSlug(name)}-${id.slice(0, 8)}`
}

/**
 * The row a link points at: by its link key, by the id prefix alone (the
 * row was renamed), or by its full id (older links and notifications).
 */
export function findByLinkKey<T extends { id: string }>(
  rows: readonly T[],
  key: string | null | undefined,
) {
  if (!key) return undefined
  const exact = rows.find((r) => r.id === key)
  if (exact) return exact
  const short = /(?:^|-)([0-9a-f]{8})$/i.exec(key)?.[1]?.toLowerCase()
  return short ? rows.find((r) => r.id.startsWith(short)) : undefined
}
