import { clientOriginFor } from "@/shared/lib/client-site"
import { headers } from "next/headers"

/** The public client site for this request (link previews' absolute URLs). */
export async function publicOrigin() {
  const h = await headers()
  return clientOriginFor(
    h.get("x-forwarded-host") ?? h.get("host"),
    h.get("x-forwarded-proto"),
  )
}

/** "en" → "en_US", anything else → "id_ID" (og:locale). */
export const ogLocale = (locale: string) =>
  locale === "en" ? "en_US" : "id_ID"

export const SITE_NAME = "Kretya Studio"
