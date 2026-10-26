import { createAdminClient } from "@/shared/api/supabase/admin"
import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { portalCodeOf } from "./portal-docs"

/**
 * Client portal sessions (/p/<name>-<code>). After the right PIN the browser gets
 * an httpOnly cookie holding a signature of the portal and its PIN hash:
 * nothing to store, and a new PIN (a new hash) signs everyone out.
 */

export type Portal = {
  id: string
  project_id: string
  token: string
  pin_hash: string
}

const SESSION_DAYS = 30

export const portalCookie = (code: string) => `krt_portal_${code}`
/** All portal pages (any name in the link), and only them. */
const COOKIE_PATH = "/p"

/** `<issued>.<signature>`: the signature covers the portal, its PIN hash
 *  (a new PIN signs everyone out) and when it was issued (it expires). */
function sessionValue(portal: Portal, issued: number) {
  const secret =
    process.env.PORTAL_SECRET ?? process.env.SUPABASE_SERVICE_KEY ?? ""
  const signature = createHmac("sha256", secret)
    .update(`${portal.id}.${portal.pin_hash}.${issued}`)
    .digest("base64url")
  return `${issued}.${signature}`
}

/** The portal behind a link key (`milxa-jjahvq`), or null (unknown link or
 *  turned off). */
export async function portalByToken(key: string): Promise<Portal | null> {
  const code = portalCodeOf(key)
  if (!code) return null
  const { data } = await createAdminClient()
    .from("project_portals" as never)
    .select("id, project_id, token, pin_hash")
    .eq("token" as never, code as never)
    .maybeSingle()
  return (data as Portal | null) ?? null
}

/** Whether this browser has opened the portal with its current PIN. */
export async function isPortalSignedIn(portal: Portal) {
  const value = (await cookies()).get(portalCookie(portal.token))?.value
  const issued = Number(value?.split(".")[0])
  if (!value || !Number.isFinite(issued)) return false
  if (Date.now() - issued > SESSION_DAYS * 24 * 60 * 60 * 1000) return false
  const expected = Buffer.from(sessionValue(portal, issued))
  const given = Buffer.from(value)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function signInToPortal(portal: Portal) {
  ;(await cookies()).set(
    portalCookie(portal.token),
    sessionValue(portal, Date.now()),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: COOKIE_PATH,
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    },
  )
}

export async function signOutOfPortal(portal: Portal) {
  ;(await cookies()).delete({
    name: portalCookie(portal.token),
    path: COOKIE_PATH,
  })
}
