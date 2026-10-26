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
