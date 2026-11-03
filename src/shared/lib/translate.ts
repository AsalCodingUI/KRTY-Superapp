/** Languages a client page can be translated to; English first. */
export const TRANSLATE_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
  { code: "zh-CN", name: "中文" },
  { code: "ko", name: "한국어" },
  { code: "ar", name: "العربية" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "nl", name: "Nederlands" },
] as const

/** From English (briefs): Indonesian first, then the rest. */
export const TRANSLATE_LANGUAGES_FROM_EN = [
  { code: "id", name: "Bahasa Indonesia" },
  ...TRANSLATE_LANGUAGES.filter((l) => l.code !== "en"),
] as const

export type TranslateLanguage =
  | (typeof TRANSLATE_LANGUAGES)[number]["code"]
  | (typeof TRANSLATE_LANGUAGES_FROM_EN)[number]["code"]
