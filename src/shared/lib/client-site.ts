/**
 * The client-facing site: `client.<domain>` serves only what a client may
 * open (the project portal and shared reports) and is the one address
 * reachable without the team's VPN. The app itself stays private.
 */
export const CLIENT_HOST_PREFIX = "client."

/** Paths the client site serves; anything else there is a 404. */
export function isClientPath(pathname: string) {
  return (
    pathname.startsWith("/p/") ||
    pathname.startsWith("/r/") ||
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
