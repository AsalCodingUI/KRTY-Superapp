"use client"

import { enUS, id as idLocale } from "date-fns/locale"
import { useRouter } from "next/navigation"
import * as React from "react"
import {
  DEFAULT_LOCALE,
  interpolate,
  LOCALE_COOKIE,
  type Locale,
  type Vars,
} from "./config"
import type { MessageKey, Namespace } from "./messages"
import type { RouteNamespace } from "./scopes"

/** One language's strings per namespace, already merged over Indonesian. */
export type ClientMessages = Record<string, Record<string, string>>

const LocaleContext = React.createContext<Locale>(DEFAULT_LOCALE)
const MessagesContext = React.createContext<ClientMessages>({})

/**
 * Set once in the root layout from the `locale` cookie. The server passes only
 * the active language's strings, so the dictionaries never ship as JS.
 */
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale
  messages: ClientMessages
  children: React.ReactNode
}) {
  return (
    <LocaleContext.Provider value={locale}>
      <MessagesContext.Provider value={messages}>
        {children}
      </MessagesContext.Provider>
    </LocaleContext.Provider>
  )
}

/**
 * Adds namespaces for one route (its layout passes them), over the root's.
 * Lets the root layout skip strings only that route uses (ROUTE_NAMESPACES).
 */
export function I18nScope({
  messages,
  children,
}: {
  messages: ClientMessages
  children: React.ReactNode
}) {
  const parent = React.useContext(MessagesContext)
  const merged = React.useMemo(
    () => ({ ...parent, ...messages }),
    [parent, messages],
  )
  return (
    <MessagesContext.Provider value={merged}>
      {children}
    </MessagesContext.Provider>
  )
}

// --- Fallback for a route namespace used outside its route ----------------
// One file each (a small chunk), fetched only when a useT finds its
// namespace missing; the strings then fill in on the next render.

type Dictionary = Record<Locale, Record<string, string>>

const routeLoaders: Record<RouteNamespace, () => Promise<Dictionary>> = {
  dashboard: () =>
    import("./messages/dashboard").then(
      (m) => m.dashboard as unknown as Dictionary,
    ),
  briefs: () =>
    import("./messages/briefs").then((m) => m.briefs as unknown as Dictionary),
  calendar: () =>
    import("./messages/calendar").then(
      (m) => m.calendar as unknown as Dictionary,
    ),
  clients: () =>
    import("./messages/clients").then(
      (m) => m.clients as unknown as Dictionary,
    ),
  contracts: () =>
    import("./messages/contracts").then(
      (m) => m.contracts as unknown as Dictionary,
    ),
  finance: () =>
    import("./messages/finance").then(
      (m) => m.finance as unknown as Dictionary,
    ),
  invoices: () =>
    import("./messages/invoices").then(
      (m) => m.invoices as unknown as Dictionary,
    ),
  leads: () =>
    import("./messages/leads").then((m) => m.leads as unknown as Dictionary),
  processes: () =>
    import("./messages/processes").then(
      (m) => m.processes as unknown as Dictionary,
    ),
  santuy: () =>
    import("./messages/santuy").then((m) => m.santuy as unknown as Dictionary),
  settings: () =>
    import("./messages/settings").then(
      (m) => m.settings as unknown as Dictionary,
    ),
  whatsNew: () =>
    import("./messages/whatsNew").then(
      (m) => m.whatsNew as unknown as Dictionary,
    ),
}

const lazyMessages = new Map<string, Record<string, string>>()
const lazyRequested = new Set<string>()
const lazyListeners = new Set<() => void>()

function subscribeLazy(listener: () => void) {
  lazyListeners.add(listener)
  return () => {
    lazyListeners.delete(listener)
  }
}

function loadLazy(namespace: string, locale: Locale) {
  const id = `${locale}:${namespace}`
  if (lazyRequested.has(id)) return
  lazyRequested.add(id)
  const load = routeLoaders[namespace as RouteNamespace]
  if (!load) return
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `i18n: "${namespace}" used outside the route that sends it; loading it lazily. Add an <I18nScope> there, or take it out of ROUTE_NAMESPACES.`,
    )
  }
  load()
    .then((dict) => {
      lazyMessages.set(
        id,
        locale === "id" ? dict.id : { ...dict.id, ...dict[locale] },
      )
      lazyListeners.forEach((listener) => listener())
    })
    .catch(() => lazyRequested.delete(id))
}

export function useLocale() {
  return React.useContext(LocaleContext)
}

/**
 * Translator for one namespace: t("key") or t("key", { n: 3 }).
 * Falls back to Indonesian, then to the key, so a gap never breaks a page.
 */
export function useT<N extends Namespace>(namespace: N) {
  const messages = React.useContext(MessagesContext)
  const locale = React.useContext(LocaleContext)
  const own = messages[namespace]
  const lazy = React.useSyncExternalStore(
    subscribeLazy,
    () => (own ? undefined : lazyMessages.get(`${locale}:${namespace}`)),
    () => undefined,
  )
  React.useEffect(() => {
    if (!own) loadLazy(namespace, locale)
  }, [own, namespace, locale])
  const dict = own ?? lazy
  return React.useCallback(
    (key: MessageKey<N>, vars?: Vars) => {
      const text = dict?.[key as string]
      return interpolate(text ?? String(key), vars)
    },
    [dict],
  )
}

/** date-fns locale matching the UI language. */
export function useDateLocale() {
  return useLocale() === "en" ? enUS : idLocale
}

/** Switches language: remembered for a year, then the server re-renders. */
export function useSetLocale() {
  const router = useRouter()
  return React.useCallback(
    (locale: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
      document.documentElement.lang = locale
      router.refresh()
    },
    [router],
  )
}
