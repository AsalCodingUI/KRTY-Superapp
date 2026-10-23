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
import { messages, type MessageKey, type Namespace } from "./messages"

const LocaleContext = React.createContext<Locale>(DEFAULT_LOCALE)

/** Set once in the root layout from the `locale` cookie. */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  return React.useContext(LocaleContext)
}

/**
 * Translator for one namespace: t("key") or t("key", { n: 3 }).
 * Falls back to Indonesian, then to the key, so a gap never breaks a page.
 */
export function useT<N extends Namespace>(namespace: N) {
  const locale = useLocale()
  return React.useCallback(
    (key: MessageKey<N>, vars?: Vars) => {
      const ns = messages[namespace] as unknown as Record<
        Locale,
        Record<string, string>
      >
      const text = ns[locale]?.[key as string] ?? ns.id[key as string]
      return interpolate(text ?? String(key), vars)
    },
    [namespace, locale],
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
