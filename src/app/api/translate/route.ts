import { NextRequest, NextResponse } from "next/server"
import {
  TRANSLATE_LANGUAGES,
  TRANSLATE_LANGUAGES_FROM_EN,
} from "@/shared/lib/translate"

/** What one call may carry: a page's worth of text, no more. */
const MAX_TEXTS = 200
const MAX_CHARS = 20_000

/**
 * "Translate this page" on client pages (a shared report, the portal):
 * strings in, the same strings in `to` out. Our content is written in
 * Indonesian (briefs: English, `from: "en"`), so that's the source; telling it beats guessing on short
 * lines. No account needed (clients have none), hence the size limits.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const to = typeof body?.to === "string" ? body.to : ""
  // Briefs are written in English; everything else in Indonesian. The
  // portal's whole-page mode mixes the UI language and Indonesian content,
  // so Google detects each string ("auto").
  const from =
    body?.from === "en" ? "en" : body?.from === "auto" ? "auto" : "id"
  const texts: unknown = body?.texts
  if (
    !(from === "en" ? TRANSLATE_LANGUAGES_FROM_EN : TRANSLATE_LANGUAGES).some(
      (l) => l.code === to,
    ) ||
    !Array.isArray(texts) ||
    texts.length === 0 ||
    texts.length > MAX_TEXTS ||
    !texts.every((s) => typeof s === "string") ||
    texts.join("").length > MAX_CHARS
  ) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  const form = new URLSearchParams()
  for (const text of texts as string[]) form.append("q", text)
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/t?client=gtx&sl=${from}&tl=${to}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(15_000),
    },
  ).catch(() => null)
  const data: unknown = await response?.json().catch(() => null)
  // One string back per string sent (a single one may come as [text, lang]).
  const out = Array.isArray(data)
    ? data.map((item) => (Array.isArray(item) ? item[0] : item))
    : null
  if (
    !out ||
    out.length !== texts.length ||
    !out.every((s) => typeof s === "string")
  ) {
    return NextResponse.json({ error: "Translation failed" }, { status: 502 })
  }
  return NextResponse.json(
    { texts: out },
    { headers: { "Cache-Control": "no-store" } },
  )
}
