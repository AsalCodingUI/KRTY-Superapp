import { createClient } from "@/shared/api/supabase/server"
import {
  AI_ACTIONS,
  AI_LANGUAGES,
  AI_MAX_CHARS,
  AI_MAX_INSTRUCTION,
  type AiAction,
  type AiErrorCode,
} from "@/shared/lib/ai-rewrite"
import { logError } from "@/shared/lib/utils/logger"
import { checkCSRF } from "@/shared/lib/utils/security"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/ai/rewrite — the editor's writing helper.
 *
 * Body: { text: markdown, action, language?, instruction?, inline? }
 *  - action: translate | casual | formal | shorter | clearer | longer |
 *    custom | summarize (a 2–4 bullet summary of the whole report)
 *  - language: a code from AI_LANGUAGES (translate only)
 *  - instruction: the writer's own request (custom only, ≤ 500 chars)
 *  - inline: the text is a piece of one paragraph, so return a piece
 *
 * Answers with the rewritten Markdown as a plain-text stream (UTF-8), or
 * JSON { error: AiErrorCode } with 400/401/413/429/502/503. Addresses
 * (links, images and their #size) never reach the model: they go out as
 * URL_n placeholders and are put back on the way in.
 */

export const dynamic = "force-dynamic"

const PER_MINUTE = 15
const PER_DAY = 300
const usage = new Map<string, { minute: number[]; day: number[] }>()

/** Counts one call for the user; false when they're over the limit. */
function allow(userId: string) {
  const now = Date.now()
  const u = usage.get(userId) ?? { minute: [], day: [] }
  u.minute = u.minute.filter((t) => now - t < 60_000)
  u.day = u.day.filter((t) => now - t < 86_400_000)
  if (u.minute.length >= PER_MINUTE || u.day.length >= PER_DAY) {
    usage.set(userId, u)
    return false
  }
  u.minute.push(now)
  u.day.push(now)
  usage.set(userId, u)
  return true
}

const fail = (error: AiErrorCode, status: number) =>
  NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  )

const SYSTEM = `You are a text-rewriting function inside a document editor, not a chat assistant.
You receive one Markdown passage inside <text> tags and one task inside <task> tags.
Rules:
- Do only the task. Output ONLY the rewritten Markdown passage: no preamble, no explanation, no notes, no quotes, no code fences around it, no tags.
- Keep the Markdown structure: headings, lists, checklists, tables, bold/italic, links and images stay in the same order and place.
- Placeholders like URL_1, URL_2 stand for addresses. Copy every placeholder exactly, once, in the same place. Never invent, drop or change one.
- Keep names of people, brands, products and code as they are.
- Never add facts, numbers, dates or names that are not in the passage.
- If the passage is already fine for the task, return it unchanged.`

/** The summary isn't a rewrite: its own short brief. */
const SUMMARY_SYSTEM = `You summarise a project report for a busy client, inside a document editor. You are not a chat assistant.
You receive one Markdown report inside <text> tags.
Output ONLY this, nothing before or after it, no code fences:
- First line: the word "Summary" translated into the report's language, in bold (e.g. **Ringkasan** for Indonesian, **Summary** for English).
- Then 2 to 4 Markdown bullet points ("- "), one short sentence each: what was done, the current state, and what's next or needed from the client, when the report says so.
Rules:
- Write in the same language as the report.
- Only facts that are in the report. Never invent numbers, dates, names or promises.
- Placeholders like URL_1 stand for links or images: leave them out.
- Plain text in the bullets: no headings, no images, no links, no tables.`

function taskFor(action: AiAction, language: string, instruction: string) {
  const same = "Write in the same language as the passage."
  switch (action) {
    case "translate":
      return `Translate the passage into ${language}. Natural and professional, the way a native speaker would write a report for a client. Translate link text and image alt text too.`
    case "casual":
      return `Rewrite it to sound more casual, relaxed and friendly. Keep the meaning and every fact. ${same}`
    case "formal":
      return `Rewrite it to sound more formal and professional. Keep the meaning and every fact. ${same}`
    case "shorter":
      return `Make it shorter and more concise. Keep every key fact, number, date and name. ${same}`
    case "clearer":
      return `Fix grammar, spelling and punctuation, and make it clearer and better organised. Keep the tone, the meaning and the facts. ${same}`
    case "longer":
      return `Make it longer and more detailed: explain and elaborate on what is already there, without inventing new facts. ${same}`
    case "custom":
      return `Follow the writer's instruction: """${instruction}""". Unless the instruction says otherwise, ${same.toLowerCase()}`
    case "summarize":
      return "Summarise the whole report in 2 to 4 bullets."
  }
}

/** Swaps every address for URL_n; returns the text and the addresses. */
function protectUrls(markdown: string) {
  const urls: string[] = []
  const token = (url: string) => {
    let i = urls.indexOf(url)
    if (i < 0) i = urls.push(url) - 1
    return `URL_${i + 1}`
  }
  const text = markdown
    // [text](url "title") and ![alt](url#size=wide)
    .replace(
      /(\]\(\s*<?)([^)\s>]+)(>?(?:\s+"[^"]*")?\s*\))/g,
      (_, a: string, url: string, b: string) => a + token(url) + b,
    )
    // <https://…>
    .replace(/<(https?:\/\/[^>\s]+)>/g, (_, url: string) => `<${token(url)}>`)
    // Bare addresses (trailing punctuation stays text).
    .replace(/https?:\/\/[^\s)<>\]]+/g, (m: string) => {
      const url = m.replace(/[.,;:!?'"]+$/, "")
      return token(url) + m.slice(url.length)
    })
  return { text, urls }
}

/** The text stream back to the client: model deltas in, with the URL_n
 *  placeholders put back (a placeholder split across chunks waits). */
function restoreStream(urls: string[]) {
  let pending = ""
  const restore = (s: string) =>
    s.replace(/URL_(\d+)/g, (m, n: string) => urls[Number(n) - 1] ?? m)
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      pending += chunk
      const hold = /U(?:R(?:L(?:_\d*)?)?)?$/.exec(pending)
      const cut = hold ? hold.index : pending.length
      const ready = pending.slice(0, cut)
      pending = pending.slice(cut)
      if (ready) controller.enqueue(restore(ready))
    },
    flush(controller) {
      if (pending) controller.enqueue(restore(pending))
    },
  })
}

type Usage = { prompt_tokens?: number; completion_tokens?: number }

/** OpenAI-style SSE (or a plain JSON answer) → text deltas; the router's
 *  token count (the last chunk, with include_usage) goes to `onUsage`. */
function deltas(upstream: Response, onUsage: (usage: Usage | null) => void) {
  const json = (upstream.headers.get("content-type") ?? "").includes(
    "application/json",
  )
  let buffer = ""
  let usage: Usage | null = null
  const pick = (
    line: string,
    controller: TransformStreamDefaultController<string>,
  ) => {
    const l = line.trim()
    if (!l.startsWith("data:")) return
    const data = l.slice(5).trim()
    if (!data || data === "[DONE]") return
    try {
      const parsed = JSON.parse(data)
      if (parsed?.usage) usage = parsed.usage
      const content = parsed?.choices?.[0]?.delta?.content
      if (typeof content === "string" && content) controller.enqueue(content)
    } catch {
      // A keep-alive or a line we don't know: skip it.
    }
  }
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      buffer += chunk
      if (json) return
      let i
      while ((i = buffer.indexOf("\n")) >= 0) {
        pick(buffer.slice(0, i), controller)
        buffer = buffer.slice(i + 1)
      }
    },
    flush(controller) {
      if (json) {
        try {
          const parsed = JSON.parse(buffer)
          if (parsed?.usage) usage = parsed.usage
          const content = parsed?.choices?.[0]?.message?.content
          if (typeof content === "string") controller.enqueue(content)
        } catch {
          // Nothing usable.
        }
      } else if (buffer) pick(buffer, controller)
      onUsage(usage)
    },
  })
}

export async function POST(request: NextRequest) {
  if (!checkCSRF(request)) return fail("bad_request", 403)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail("unauthorized", 401)

  const baseUrl = process.env.AI_BASE_URL?.trim().replace(/\/+$/, "")
  const apiKey = process.env.AI_API_KEY?.trim()
  const model = process.env.AI_MODEL?.trim()
  if (!baseUrl || !apiKey || !model) return fail("not_configured", 503)

  const body = await request.json().catch(() => null)
  const text: unknown = body?.text
  const action: unknown = body?.action
  const instruction =
    typeof body?.instruction === "string" ? body.instruction.trim() : ""
  const language = AI_LANGUAGES.find((l) => l.code === body?.language)
  if (
    typeof text !== "string" ||
    !text.trim() ||
    !AI_ACTIONS.includes(action as AiAction) ||
    (action === "translate" && !language) ||
    (action === "custom" && !instruction) ||
    instruction.length > AI_MAX_INSTRUCTION
  )
    return fail("bad_request", 400)
  if (text.length > AI_MAX_CHARS) return fail("too_long", 413)
  if (!allow(user.id)) return fail("rate_limited", 429)

  const { text: safe, urls } = protectUrls(text)
  const languageName = language
    ? "english" in language
      ? `${language.english} (${language.name})`
      : language.name
    : ""
  const summary = action === "summarize"
  let task = taskFor(action as AiAction, languageName, instruction)
  if (body?.inline === true && !summary)
    task +=
      " The passage is a piece of a single paragraph: return a piece too (no headings, no list markers, no new paragraphs)."

  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model,
      stream: true,
      // The router's token count arrives in the last chunk.
      stream_options: { include_usage: true },
      temperature: action === "custom" || action === "longer" ? 0.5 : 0.3,
      // A summary stays short; rewrites may be as long as the text.
      ...(summary ? { max_tokens: 400, temperature: 0.2 } : {}),
      messages: [
        { role: "system", content: summary ? SUMMARY_SYSTEM : SYSTEM },
        {
          role: "user",
          content: `<task>${task}</task>\n\n<text>\n${safe}\n</text>`,
        },
      ],
    }),
    // Stops the model when the writer discards (or leaves) mid-answer.
    signal: AbortSignal.any([request.signal, AbortSignal.timeout(120_000)]),
  }).catch((error: unknown) => {
    if (!request.signal.aborted)
      logError("AI rewrite: upstream unreachable", error, {
        action: String(action),
      })
    return null
  })
  if (!upstream?.ok || !upstream.body) {
    if (upstream)
      logError("AI rewrite: upstream error", undefined, {
        status: upstream.status,
        action: String(action),
      })
    return fail("upstream", 502)
  }

  const stream = upstream.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(
      // Cost log for the owner: the action and token counts, no content.
      deltas(upstream, (usage) =>
        console.info(
          `[ai] action=${String(action)} model=${model} prompt_tokens=${usage?.prompt_tokens ?? "?"} completion_tokens=${usage?.completion_tokens ?? "?"}`,
        ),
      ),
    )
    .pipeThrough(restoreStream(urls))
    .pipeThrough(new TextEncoderStream())

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  })
}
