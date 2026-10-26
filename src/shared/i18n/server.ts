import { enUS, id as idLocale } from "date-fns/locale"
import { cookies, headers } from "next/headers"
import {
  DEFAULT_LOCALE_HEADER,
  interpolate,
  LOCALE_COOKIE,
  toLocale,
  type Vars,
} from "./config"
import { messages, type MessageKey, type Namespace } from "./messages"

/** The viewer's language from the `locale` cookie (default Indonesian, or
 *  the page's own default, e.g. English on client pages). */
export async function getLocale() {
  return toLocale(
    (await cookies()).get(LOCALE_COOKIE)?.value ??
      (await headers()).get(DEFAULT_LOCALE_HEADER),
  )
}

/** Server-side translator (pages, server actions, route handlers). */
export async function getT<N extends Namespace>(namespace: N) {
  const locale = await getLocale()
  const ns = messages[namespace] as unknown as Record<
    string,
    Record<string, string>
  >
  return (key: MessageKey<N>, vars?: Vars) =>
    interpolate(
      ns[locale]?.[key as string] ?? ns.id[key as string] ?? String(key),
      vars,
    )
}

export async function getDateLocale() {
  return (await getLocale()) === "en" ? enUS : idLocale
}

/**
 * The active language's strings for the client, each namespace merged over
 * Indonesian so a missing key still falls back the same way as on the server.
 */
export function getClientMessages(locale: string) {
  const out: Record<string, Record<string, string>> = {}
  for (const [name, ns] of Object.entries(messages)) {
    const byLocale = ns as unknown as Record<string, Record<string, string>>
    out[name] =
      locale === "id" ? byLocale.id : { ...byLocale.id, ...byLocale[locale] }
  }
  return out
}
