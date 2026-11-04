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
import { ROUTE_NAMESPACES, SERVER_ONLY_NAMESPACES } from "./scopes"

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
 * Without `only`: every namespace the shell and pages share, i.e. all but the
 * server-only and route-scoped ones (those come from their route's layout,
 * see ROUTE_NAMESPACES). With `only`: just those namespaces.
 */
export function getClientMessages(locale: string, only?: readonly Namespace[]) {
  const skip = new Set<string>([...SERVER_ONLY_NAMESPACES, ...ROUTE_NAMESPACES])
  const names = only ?? (Object.keys(messages) as Namespace[])
  const out: Record<string, Record<string, string>> = {}
  for (const name of names) {
    if (!only && skip.has(name)) continue
    const byLocale = messages[name] as unknown as Record<
      string,
      Record<string, string>
    >
    out[name] =
      locale === "id" ? byLocale.id : { ...byLocale.id, ...byLocale[locale] }
  }
  return out
}
