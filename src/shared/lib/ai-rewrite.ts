/**
 * The writing helper in the document editor ("AI" on selected text, or the
 * whole report): what it can do and into which languages. Shared by the
 * route (/api/ai/rewrite) and the editor menu.
 */
export const AI_ACTIONS = [
  "translate",
  "casual",
  "formal",
  "shorter",
  "clearer",
  "longer",
  "custom",
  "summarize",
] as const
export type AiAction = (typeof AI_ACTIONS)[number]

/** Languages to translate into; English first (reports go to clients). */
export const AI_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ja", name: "日本語", english: "Japanese" },
  { code: "zh", name: "中文", english: "Simplified Chinese" },
  { code: "ko", name: "한국어", english: "Korean" },
  { code: "ar", name: "العربية", english: "Arabic" },
  { code: "es", name: "Español", english: "Spanish" },
  { code: "fr", name: "Français", english: "French" },
  { code: "de", name: "Deutsch", english: "German" },
  { code: "nl", name: "Nederlands", english: "Dutch" },
] as const
export type AiLanguage = (typeof AI_LANGUAGES)[number]["code"]

/** What one call may carry. */
export const AI_MAX_CHARS = 20_000
export const AI_MAX_INSTRUCTION = 500

/** Error codes the route answers with (the UI words them). */
export type AiErrorCode =
  | "unauthorized"
  | "not_configured"
  | "rate_limited"
  | "too_long"
  | "bad_request"
  | "upstream"

/** Every address in a passage: link and image targets, bare URLs. */
export function markdownUrls(markdown: string): string[] {
  const urls: string[] = []
  for (const m of markdown.matchAll(
    /\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g,
  ))
    urls.push(m[1])
  for (const m of markdown.matchAll(/<(https?:\/\/[^>\s]+)>/g)) urls.push(m[1])
  for (const m of markdown
    .replace(/\]\([^)]*\)/g, "]()")
    .replace(/<https?:\/\/[^>\s]+>/g, "")
    .matchAll(/https?:\/\/[^\s)<>\]]+/g))
    urls.push(m[0])
  return urls
}
