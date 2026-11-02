"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import {
  TRANSLATE_LANGUAGES,
  type TranslateLanguage,
} from "@/shared/lib/translate"
import { Languages } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

const STORAGE_KEY = "krty-translate"
const ORIGINAL = "original"
/** Per request to /api/translate (it takes up to 200 / 20k). */
const CHUNK_TEXTS = 150
const CHUNK_CHARS = 15_000

type Choice = TranslateLanguage | typeof ORIGINAL

const SKIP =
  "script, style, code, pre, textarea, [translate=no], [data-no-translate]"

/** The page's text nodes worth translating (they have letters in them). */
function textNodes(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      /\p{L}/u.test(node.nodeValue ?? "") && !node.parentElement?.closest(SKIP)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  })
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  return nodes
}

/** Sends strings in chunks; returns them translated, in order. */
async function translateAll(texts: string[], to: TranslateLanguage) {
  const out: string[] = []
  let start = 0
  while (start < texts.length) {
    let end = start
    let chars = 0
    while (
      end < texts.length &&
      end - start < CHUNK_TEXTS &&
      chars + texts[end].length <= CHUNK_CHARS
    ) {
      chars += texts[end].length
      end++
    }
    // One string longer than a chunk: send it alone, cut to size.
    const chunk =
      end === start
        ? [texts[start].slice(0, CHUNK_CHARS)]
        : texts.slice(start, end)
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: chunk, to }),
    })
    if (!response.ok) throw new Error("translate")
    const { texts: done } = (await response.json()) as { texts: string[] }
    out.push(...done)
    start = Math.max(end, start + 1)
  }
  return out
}

/**
 * "Translate" on client pages: the content under `[data-translate-root]`
 * (written in Indonesian) shown in another language, English first, or back
 * to the original. Swaps text in place and keeps up as the page changes;
 * the pick is remembered on this device.
 */
export function PageTranslator({ className }: { className?: string }) {
  const t = useT("common")
  const [choice, setChoice] = useState<Choice>(ORIGINAL)
  const [busy, setBusy] = useState(false)
  // Each node's own text, what we put in it, and translations seen so far.
  const originals = useRef(new Map<Text, string>())
  const applied = useRef(new Map<Text, string>())
  const cache = useRef(new Map<string, string>())
  const active = useRef<Choice>(ORIGINAL)

  const roots = () =>
    Array.from(document.querySelectorAll("[data-translate-root]"))

  const restore = useCallback(() => {
    for (const [node, text] of originals.current) {
      if (node.isConnected && applied.current.get(node) === node.nodeValue)
        node.nodeValue = text
    }
    originals.current.clear()
    applied.current.clear()
    for (const root of roots()) root.removeAttribute("dir")
  }, [])

  const apply = useCallback(async (to: TranslateLanguage) => {
    const nodes = roots().flatMap(textNodes)
    // A node keeps its original until React writes something new in it.
    for (const node of nodes) {
      const value = node.nodeValue ?? ""
      if (applied.current.get(node) !== value) {
        originals.current.set(node, value)
        applied.current.delete(node)
      }
    }
    const pending = nodes.filter((n) => applied.current.get(n) === undefined)
    const sources = pending.map((n) => originals.current.get(n)!.trim())
    const missing = [
      ...new Set(sources.filter((s) => !cache.current.has(`${to}:${s}`))),
    ]
    if (missing.length > 0) {
      const done = await translateAll(missing, to)
      missing.forEach((s, i) => cache.current.set(`${to}:${s}`, done[i]))
    }
    if (active.current !== to) return
    pending.forEach((node, i) => {
      const original = originals.current.get(node)!
      const translated = cache.current.get(`${to}:${sources[i]}`)
      if (!translated || !node.isConnected) return
      // Keep the spacing around the words (it separates inline elements).
      const lead = /^\s*/.exec(original)![0]
      const trail = /\s*$/.exec(original)![0]
      const value = `${lead}${translated}${trail}`
      node.nodeValue = value
      applied.current.set(node, value)
    })
    for (const root of roots())
      if (to === "ar") root.setAttribute("dir", "rtl")
      else root.removeAttribute("dir")
  }, [])

  const pick = useCallback(
    async (next: Choice, quiet = false) => {
      active.current = next
      setChoice(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {}
      restore()
      if (next === ORIGINAL) return
      setBusy(true)
      try {
        await apply(next)
      } catch {
        if (!quiet) toast.error(t("translateFailed"))
        active.current = ORIGINAL
        setChoice(ORIGINAL)
        restore()
      } finally {
        setBusy(false)
      }
    },
    [apply, restore, t],
  )

  // The last pick on this device, once the page is there; English the first
  // time (clients read in English). "Original" stays original once chosen.
  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {}
    if (saved === ORIGINAL) return
    const language = TRANSLATE_LANGUAGES.some((l) => l.code === saved)
      ? (saved as TranslateLanguage)
      : "en"
    void pick(language, true)
  }, [pick])

  // New content (another tab of the portal, a report opened): translate it
  // too, a moment after it settles.
  useEffect(() => {
    let timer: number | undefined
    const observer = new MutationObserver(() => {
      if (active.current === ORIGINAL) return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const to = active.current
        if (to !== ORIGINAL) void apply(to).catch(() => {})
      }, 400)
    })
    for (const root of roots())
      observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
    }
  }, [apply])

  const current = TRANSLATE_LANGUAGES.find((l) => l.code === choice)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            data-no-translate
            className={cn("blend-ink text-muted-foreground", className)}
            aria-label={t("translatePage")}
          />
        }
      >
        {busy ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <Languages data-icon="inline-start" />
        )}
        <span className="max-sm:sr-only">
          {current ? current.name : t("translate")}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48" data-no-translate>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("translatePage")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={choice}
            onValueChange={(value) => void pick(value as Choice)}
          >
            {TRANSLATE_LANGUAGES.map((language) => (
              <DropdownMenuRadioItem key={language.code} value={language.code}>
                {language.name}
              </DropdownMenuRadioItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuRadioItem value={ORIGINAL}>
              {t("translateOriginal")}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
