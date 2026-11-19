const KEY = "krty:chunk-reload"

/**
 * A script or style chunk that failed to load: the page is older than the
 * deploy (its chunks are gone) or the request went somewhere else (network,
 * DNS). Reloading fetches the current build.
 */
export function isStaleChunkError(error: unknown) {
  const e = error as { name?: string; message?: string } | null | undefined
  const text = `${e?.name ?? ""} ${e?.message ?? ""}`
  return /ChunkLoadError|Loading (CSS )?chunk|dynamically imported module|Importing a module script failed/i.test(
    text,
  )
}

/** Reloads the page for a stale chunk, at most once per 30 s (no loop when
 *  the server is really down). True when a reload started. */
export function reloadForStaleChunk(error: unknown) {
  if (typeof window === "undefined" || !isStaleChunkError(error)) return false
  try {
    const last = Number(window.sessionStorage.getItem(KEY) ?? 0)
    if (Date.now() - last < 30_000) return false
    window.sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}
