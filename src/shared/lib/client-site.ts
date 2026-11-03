/**
 * The client-facing site: `client.<domain>` serves only what a client may
 * open (the project portal and shared reports) and is the one address
 * reachable without the team's VPN. Briefs (/b/) are filled there too. The app itself stays private.
 */
export const CLIENT_HOST_PREFIX = "client."

/** Paths the client site serves; anything else there is a 404. */
export function isClientPath(pathname: string) {
  return (
    pathname.startsWith("/p/") ||
    pathname.startsWith("/r/") ||
    pathname.startsWith("/b/") ||
    // "Translate" on those pages.
    pathname === "/api/translate" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest"
  )
}

export function isClientHost(host: string | null) {
  return Boolean(host?.startsWith(CLIENT_HOST_PREFIX))
}

/**
 * The public client site's origin, server side (absolute links in link
 * previews: crawlers can't reach the app's VPN-only host). Set
 * `NEXT_PUBLIC_CLIENT_URL` to pin it; otherwise it follows the request:
 * the client host as it is, localhost as it is, and `app.<domain>` (or any
 * other host) → `client.<domain>`.
 */
export function clientOriginFor(host: string | null, proto?: string | null) {
  const pinned = process.env.NEXT_PUBLIC_CLIENT_URL?.replace(/\/+$/, "")
  if (pinned) return pinned
  const name = (host ?? "").split(",")[0].trim().toLowerCase()
  if (!name) {
    return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
      /\/+$/,
      "",
    )
  }
  const hostname = name.replace(/:\d+$/, "")
  const local =
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    /^[\d.]+$/.test(hostname) ||
    hostname.startsWith("[")
  const scheme =
    (proto ?? "").split(",")[0].trim() || (local ? "http" : "https")
  if (local || isClientHost(name)) return `${scheme}://${name}`
  const domain = hostname.split(".").slice(-2).join(".")
  return `https://${CLIENT_HOST_PREFIX}${domain}`
}

/**
 * The address to give a client for `path` (`/p/…`, `/r/…`): the public
 * client site next to the app's domain, or this origin when running
 * locally (localhost has no client site).
 */
export function clientUrl(path: string) {
  const { protocol, hostname, port, origin } = window.location
  if (hostname === "localhost" || /^[\d.]+$/.test(hostname)) {
    return `${origin}${path}`
  }
  // app.example.com / staging.example.com → client.example.com
  const domain = hostname.split(".").slice(-2).join(".")
  return `${protocol}//${CLIENT_HOST_PREFIX}${domain}${port ? `:${port}` : ""}${path}`
}
