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

export function useLocale() {
  return React.useContext(LocaleContext)
}

/**
 * Translator for one namespace: t("key") or t("key", { n: 3 }).
 * Falls back to Indonesian, then to the key, so a gap never breaks a page.
 */
export function useT<N extends Namespace>(namespace: N) {
  const messages = React.useContext(MessagesContext)
  return React.useCallback(
    (key: MessageKey<N>, vars?: Vars) => {
      const text = messages[namespace]?.[key as string]
      return interpolate(text ?? String(key), vars)
    },
    [namespace, messages],
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
