export const LOCALES = ["id", "en"] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "id"
export const LOCALE_COOKIE = "locale"
/** Set by the middleware where a page's default isn't Indonesian (client
 *  pages default to English). */
export const DEFAULT_LOCALE_HEADER = "x-default-locale"

export function toLocale(value: string | null | undefined): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE
}

export type Vars = Record<string, string | number>

/** "Halo {name}" + { name: "Adi" } → "Halo Adi"; unknown keys stay as-is. */
export function interpolate(text: string, vars?: Vars) {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  )
}
