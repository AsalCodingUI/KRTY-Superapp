"use client"

import { Markdown } from "@/components/markdown"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import {
  AI_LANGUAGES,
  AI_MAX_INSTRUCTION,
  markdownUrls,
  type AiAction,
  type AiErrorCode,
  type AiLanguage,
} from "@/shared/lib/ai-rewrite"
import { useT } from "@/shared/i18n/client"
import type { Editor, JSONContent } from "@tiptap/react"
import {
  ArrowUp,
  ArrowUpToLine,
  Briefcase,
  ChevronDown,
  Copy,
  Languages,
  Maximize2,
  Minimize2,
  RotateCcw,
  ScrollText,
  Smile,
  Sparkles,
  Square,
  TriangleAlert,
  WandSparkles,
  X,
} from "@/components/icons"
import { useIsMobile } from "@/hooks/use-mobile"
import { toast } from "sonner"
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

/*
 * The editor's writing helper: pick an action on selected text (the
 * selection menu) or on the whole document (a header button), watch the
 * answer stream into a preview under the document, then Replace / Insert
 * below / Discard. Nothing touches the document until the writer applies
 * it, and applying is one undo step.
 */

type AiRequest = {
  action: AiAction
  language?: AiLanguage
  instruction?: string
}

type AiJob = AiRequest & {
  scope: "selection" | "doc"
  /** The range the answer is for (kept up to date as the document changes). */
  from: number
  to: number
  /** A piece of one paragraph: the answer goes back inline. */
  inline: boolean
  /** The Markdown sent. */
  source: string
  status: "streaming" | "done" | "error"
  result: string
  error?: AiErrorCode | "empty"
  controller: AbortController
}

/** One helper per editor: its current job, for whoever shows it. */
class AiStore {
  job: AiJob | null = null
  private listeners = new Set<() => void>()

  constructor(editor: Editor) {
    // Edits elsewhere while the answer is shown move its range along.
    editor.on("transaction", ({ transaction }) => {
      const job = this.job
      if (!job || !transaction.docChanged) return
      this.set({
        ...job,
        from: transaction.mapping.map(job.from, -1),
        to: transaction.mapping.map(job.to, 1),
      })
    })
    editor.on("destroy", () => this.clear())
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  get = () => this.job
  set(job: AiJob | null) {
    this.job = job
    this.listeners.forEach((l) => l())
  }
  patch(controller: AbortController, next: Partial<AiJob>) {
    // A stale job (discarded or replaced) doesn't write over the new one.
    if (this.job?.controller === controller) this.set({ ...this.job, ...next })
  }
  clear() {
    this.job?.controller.abort()
    this.set(null)
  }
}

const stores = new WeakMap<Editor, AiStore>()
function storeOf(editor: Editor) {
  let store = stores.get(editor)
  if (!store) {
    store = new AiStore(editor)
    stores.set(editor, store)
  }
  return store
}

function useAiJob(editor: Editor) {
  const store = storeOf(editor)
  return useSyncExternalStore(store.subscribe, store.get, () => null)
}

const toMarkdown = (editor: Editor, content: JSONContent[]) =>
  editor.markdown?.serialize({ type: "doc", content }) ?? ""

/**
 * What the action works on: the selection (a piece of a paragraph as it
 * is; anything bigger widened to whole top-level blocks, which also keeps
 * pictures whole), or the whole document.
 */
function targetOf(editor: Editor, scope: AiJob["scope"]) {
  const { doc, selection } = editor.state
  if (scope === "doc" || selection.empty)
    return {
      from: 0,
      to: doc.content.size,
      inline: false,
      source: editor.getMarkdown(),
    }
  const { $from, from } = selection
  // A selection ending at the very start of a block (triple-click) ends
  // in the block before.
  const $to =
    selection.$to.parentOffset === 0 && selection.to > from + 1
      ? doc.resolve(selection.to - 1)
      : selection.$to
  const parent = $from.parent
  if ($from.sameParent($to) && parent.isTextblock) {
    const whole =
      $from.parentOffset === 0 && $to.parentOffset === parent.content.size
    if (!whole)
      return {
        from,
        to: $to.pos,
        inline: true,
        source: toMarkdown(editor, [
          {
            type: "paragraph",
            content: parent
              .slice($from.parentOffset, $to.parentOffset)
              .content.toJSON(),
          },
        ]),
      }
  }
  const start = $from.depth ? $from.before(1) : 0
  const end = $to.depth ? $to.after(1) : doc.content.size
  return {
    from: start,
    to: end,
    inline: false,
    source: toMarkdown(editor, doc.slice(start, end).content.toJSON()),
  }
}

/** Starts an action; its answer shows in the editor's AiPreview. */
export function startAi(
  editor: Editor,
  scope: AiJob["scope"],
  request: AiRequest,
  /** The same text again (Retry), instead of reading the selection. */
  target?: Pick<AiJob, "from" | "to" | "inline" | "source">,
) {
  const store = storeOf(editor)
  store.clear()
  target ??= targetOf(editor, scope)
  const controller = new AbortController()
  const job: AiJob = {
    ...request,
    ...target,
    scope,
    status: "streaming",
    result: "",
    controller,
  }
  if (!target.source.trim()) {
    store.set({ ...job, status: "error", error: "bad_request" })
    return
  }
  store.set(job)
  void run(store, job)
}

async function run(store: AiStore, job: AiJob) {
  const { controller } = job
  try {
    const res = await fetch("/api/ai/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: job.source,
        action: job.action,
        language: job.language,
        instruction: job.instruction,
        inline: job.inline,
      }),
      signal: controller.signal,
    })
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => null)
      store.patch(controller, {
        status: "error",
        error: (data?.error as AiErrorCode | undefined) ?? "upstream",
      })
      return
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let result = ""
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      result += decoder.decode(value, { stream: true })
      store.patch(controller, { result })
    }
    result += decoder.decode()
    store.patch(
      controller,
      cleanResult(result)
        ? { status: "done", result }
        : { status: "error", error: "empty", result },
    )
  } catch {
    if (controller.signal.aborted) return
    store.patch(controller, { status: "error", error: "upstream" })
  }
}

/** The answer without what a model sometimes wraps it in. */
function cleanResult(text: string) {
  return text
    .trim()
    .replace(/^<text>\s*|\s*<\/text>$/g, "")
    .replace(/^```(?:markdown|md)?[ \t]*\n([\s\S]*?)\n?```$/i, "$1")
    .trim()
}

/** Addresses the source had that the answer lost or changed. */
function lostUrls(source: string, result: string) {
  const out = new Set(markdownUrls(result))
  return markdownUrls(source).filter((url) => !out.has(url))
}

/**
 * A summary as one block for the top of the report: a callout when the
 * editor has them (`> [!NOTE]`), else a quote. Its first line is the
 * bold "Ringkasan" / "Summary" the model writes.
 */
function summaryBlock(editor: Editor, summary: string) {
  const quoted = summary
    .split("\n")
    .map((line) => (line.trim() ? `> ${line}` : ">"))
    .join("\n")
  const callouts =
    editor.markdown?.parse("> [!NOTE]\n> x")?.content?.[0]?.type !==
    "blockquote"
  return callouts ? `> [!NOTE]\n${quoted}` : quoted
}

/** Puts the answer in: over its range, as new blocks after it, or (a
 *  summary) at the very top. One transaction, so one undo. */
function apply(editor: Editor, job: AiJob, mode: "replace" | "below" | "top") {
  const result = cleanResult(job.result)
  const parsed = editor.markdown?.parse(
    mode === "top" ? summaryBlock(editor, result) : result,
  )
  let content: JSONContent[] = parsed?.content ?? []
  if (content.length === 0) return false
  if (mode === "top")
    return editor
      .chain()
      .focus()
      .insertContentAt(0, content)
      .scrollIntoView()
      .run()
  const { doc } = editor.state
  const from = Math.min(job.from, doc.content.size)
  const to = Math.min(job.to, doc.content.size)
  if (mode === "replace") {
    // Back into the same paragraph: its text, not a new paragraph.
    if (job.inline && content.length === 1 && content[0].type === "paragraph")
      content = content[0].content ?? []
    return editor
      .chain()
      .focus()
      .insertContentAt({ from, to }, content, { updateSelection: true })
      .run()
  }
  // Below: after the top-level block the range ends in.
  const $end = doc.resolve(to)
  const at = job.inline && $end.depth ? $end.after(1) : to
  return editor.chain().focus().insertContentAt(at, content).run()
}

const ACTION_ICONS = {
  casual: Smile,
  formal: Briefcase,
  shorter: Minimize2,
  clearer: WandSparkles,
  longer: Maximize2,
} as const
const TONE_ACTIONS = Object.keys(ACTION_ICONS) as (keyof typeof ACTION_ICONS)[]

/** The action label as the preview names it. */
function useActionLabel() {
  const t = useT("ai")
  return (job: AiRequest) => {
    if (job.action === "translate") {
      const lang = AI_LANGUAGES.find((l) => l.code === job.language)
      return t("translateTo", {
        language: lang?.code === "id" ? "Indonesia" : (lang?.name ?? ""),
      })
    }
    if (job.action === "custom") return job.instruction ?? t("custom")
    return t(job.action)
  }
}

function Row({
  icon: Icon,
  children,
  onPick,
}: {
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  onPick: () => void
}) {
  return (
    <button
      type="button"
      // Keeps the editor's selection while picking.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
      className="hover:bg-muted focus-visible:bg-muted rounded-row flex min-h-8 w-full items-center gap-2 px-2 py-1.5 text-left text-sm outline-none"
    >
      {Icon ? (
        <Icon className="text-muted-foreground size-4 shrink-0" />
      ) : (
        <span className="size-4 shrink-0" />
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  )
}

/**
 * The actions, as a list: translate (English first), tone and length, and
 * the writer's own request. Shared by the selection menu and the header
 * button.
 */
export function AiActionList({
  onPick,
  summarize,
  className,
}: {
  onPick: (request: AiRequest) => void
  /** Offer "Ringkas report" first (whole report only). */
  summarize?: boolean
  className?: string
}) {
  const t = useT("ai")
  const [more, setMore] = useState(false)
  const [instruction, setInstruction] = useState("")

  return (
    <div className={cn("flex w-64 max-w-full flex-col p-1", className)}>
      {summarize && (
        <>
          <Row icon={ScrollText} onPick={() => onPick({ action: "summarize" })}>
            {t("summarize")}
          </Row>
          <div className="bg-border my-1 h-px" />
        </>
      )}
      <p className="text-muted-foreground px-2 pt-1 pb-1 text-xs font-medium">
        {t("translate")}
      </p>
      <Row
        icon={Languages}
        onPick={() => onPick({ action: "translate", language: "en" })}
      >
        English
      </Row>
      <Row onPick={() => onPick({ action: "translate", language: "id" })}>
        Indonesia
      </Row>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setMore((m) => !m)}
        aria-expanded={more}
        className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-row flex min-h-8 w-full items-center gap-2 px-2 py-1.5 text-left text-sm outline-none"
      >
        <span className="size-4 shrink-0" />
        <span className="flex-1">{t("otherLanguages")}</span>
        <ChevronDown
          className={cn("size-4 transition-transform", more && "rotate-180")}
        />
      </button>
      {more && (
        <div className="grid grid-cols-2 gap-0.5 pb-1 pl-6">
          {AI_LANGUAGES.filter((l) => l.code !== "en" && l.code !== "id").map(
            (l) => (
              <button
                key={l.code}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  onPick({ action: "translate", language: l.code })
                }
                className="hover:bg-muted rounded-row truncate px-2 py-1 text-left text-sm"
              >
                {l.name}
              </button>
            ),
          )}
        </div>
      )}
      <div className="bg-border my-1 h-px" />
      {TONE_ACTIONS.map((action) => (
        <Row
          key={action}
          icon={ACTION_ICONS[action]}
          onPick={() => onPick({ action })}
        >
          {t(action)}
        </Row>
      ))}
      <div className="bg-border my-1 h-px" />
      <form
        className="flex items-center gap-1 px-1 pb-0.5"
        onSubmit={(e) => {
          e.preventDefault()
          const text = instruction.trim()
          if (text) onPick({ action: "custom", instruction: text })
        }}
      >
        <Sparkles className="text-primary size-4 shrink-0" />
        <input
          value={instruction}
          maxLength={AI_MAX_INSTRUCTION}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder={t("custom")}
          title={t("customPlaceholder")}
          aria-label={t("customPlaceholder")}
          className="placeholder:text-muted-foreground h-8 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm shadow-none outline-none focus:ring-0"
        />
        <Button
          type="submit"
          size="icon-xs"
          variant="ghost"
          aria-label={t("customSend")}
          disabled={!instruction.trim()}
        >
          <ArrowUp />
        </Button>
      </form>
    </div>
  )
}

/** The selection menu's AI panel; closes on Escape or a new selection. */
export function AiSelectionPanel({
  editor,
  onClose,
}: {
  editor: Editor
  onClose: () => void
}) {
  useEffect(() => {
    const close = () => onClose()
    editor.on("selectionUpdate", close)
    return () => {
      editor.off("selectionUpdate", close)
    }
  }, [editor, onClose])
  return (
    <div
      onKeyDown={(e) => {
        if (e.key !== "Escape") return
        // Only the panel closes, not the dialog around it.
        e.stopPropagation()
        onClose()
        editor.commands.focus()
      }}
    >
      <AiActionList
        onPick={(request) => {
          startAi(editor, "selection", request)
          // Let the selection go (the answer's text stays highlighted), so
          // the selection menu doesn't sit on the answer.
          editor.commands.setTextSelection(editor.state.selection.to)
          onClose()
        }}
      />
    </div>
  )
}

/** "AI" for the whole document, for an editor's header. */
export function AiDocButton({
  editor,
  summarize,
  className,
}: {
  editor: Editor
  /** Adds "Ringkas report" (a short summary to put at the top). */
  summarize?: boolean
  className?: string
}) {
  const t = useT("ai")
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label={t("aiWholeDoc")}
            title={t("aiWholeDoc")}
            className={className}
          />
        }
      >
        <Sparkles data-icon="inline-start" />
        <span className="hidden sm:inline">{t("ai")}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-1">
        <AiActionList
          summarize={summarize}
          onPick={(request) => {
            setOpen(false)
            startAi(editor, "doc", request)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

/** Marks the text an answer is for (the selection itself is let go, so the
 *  selection menu doesn't sit on the card). CSS Custom Highlight: no
 *  change to the document. */
function useTargetHighlight(editor: Editor, job: AiJob | null) {
  const from = job?.scope === "selection" ? job.from : null
  const to = job?.scope === "selection" ? job.to : null
  useEffect(() => {
    if (from === null || to === null) return
    if (typeof Highlight === "undefined" || !("highlights" in CSS)) return
    try {
      const start = editor.view.domAtPos(from)
      const end = editor.view.domAtPos(to)
      const range = document.createRange()
      range.setStart(start.node, start.offset)
      range.setEnd(end.node, end.offset)
      CSS.highlights.set("ai-target", new Highlight(range))
    } catch {
      return
    }
    return () => {
      CSS.highlights.delete("ai-target")
    }
  }, [editor, from, to])
}

/** The nearest scrolling ancestor (the editor's scroll area). */
function scrollParentOf(el: HTMLElement | null) {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p)
    if (overflowY === "auto" || overflowY === "scroll") return p
  }
  return null
}

/**
 * Where a selection's card goes, inside the editor's positioned wrapper
 * (so it scrolls with the text): under the text, or above it when there's
 * no room below in the scroll area; kept within the wrapper's width.
 */
function useCardPosition(
  editor: Editor,
  job: AiJob | null,
  card: React.RefObject<HTMLElement | null>,
) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const active = job?.scope === "selection"
  const from = job?.from ?? 0
  const to = job?.to ?? 0
  const result = job?.result
  const status = job?.status

  useLayoutEffect(() => {
    const el = card.current
    if (!active || !el) return
    const wrapper = el.offsetParent as HTMLElement | null
    const scroller = scrollParentOf(el)
    const place = () => {
      if (!wrapper || editor.isDestroyed) return
      const size = editor.state.doc.content.size
      let start, end
      try {
        start = editor.view.coordsAtPos(Math.min(from, size), 1)
        end = editor.view.coordsAtPos(Math.min(to, size), -1)
      } catch {
        return
      }
      const box = wrapper.getBoundingClientRect()
      const view = scroller?.getBoundingClientRect() ?? {
        top: 0,
        bottom: window.innerHeight,
      }
      const h = el.offsetHeight
      const w = el.offsetWidth
      const gap = 8
      const below = end.bottom + gap + h <= view.bottom - 8
      const above = start.top - gap - h >= view.top + 8
      const top =
        !below && above
          ? start.top - box.top - gap - h
          : end.bottom - box.top + gap
      const left = Math.max(
        0,
        Math.min(start.left - box.left - 16, box.width - w),
      )
      setPos((p) =>
        p && Math.abs(p.top - top) < 1 && Math.abs(p.left - left) < 1
          ? p
          : { top, left },
      )
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(el)
    scroller?.addEventListener("scroll", place, { passive: true })
    window.addEventListener("resize", place)
    return () => {
      observer.disconnect()
      scroller?.removeEventListener("scroll", place)
      window.removeEventListener("resize", place)
    }
  }, [editor, card, active, from, to, result, status])

  return active ? pos : null
}

/**
 * The answer, as a card over the document: under the selected text (above
 * it when there's no room), or for the whole document (and on phones)
 * docked at the bottom centre of the scroll area. It streams in, then
 * Replace / Insert below / Retry / Discard; Escape closes it. Render it as
 * the first child of the editor's positioned wrapper (inside the scroll
 * area); nothing shows while there's no job.
 */
export function AiPreview({
  editor,
  slot,
}: {
  editor: Editor
  /** "top": first in the wrapper (the card under a selection); "end":
   *  last in it (the docked card). Render both. */
  slot: "top" | "end"
}) {
  const job = useAiJob(editor)
  const phone = useIsMobile()
  const card = useRef<HTMLElement>(null)
  const pos = useCardPosition(editor, phone ? null : job, card)
  useTargetHighlight(editor, job)

  // Escape in the text closes the card (before the dialog sees it).
  const open = Boolean(job)
  useEffect(() => {
    if (!open) return
    const dom = editor.view.dom
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      e.preventDefault()
      e.stopPropagation()
      storeOf(editor).clear()
    }
    dom.addEventListener("keydown", onKey, true)
    return () => dom.removeEventListener("keydown", onKey, true)
  }, [editor, open])

  if (!job) return null
  // The card under the selection goes first in the wrapper; the docked
  // card (whole document, or anything on a phone) goes last, so it can
  // stick to the bottom of the scroll area.
  const docked = phone || job.scope === "doc"
  if ((slot === "end") !== docked) return null

  const highlight = (
    <style>
      {
        "::highlight(ai-target){background-color:color-mix(in oklab,var(--primary) 20%,transparent)}"
      }
    </style>
  )

  if (docked)
    return (
      // Floating at the bottom centre of the scroll area, over the end of
      // the text, so what's above stays readable.
      <div
        className={cn(
          "pointer-events-none sticky bottom-0 z-30 h-0",
          phone && "-mx-4",
        )}
      >
        {highlight}
        <AiCard
          ref={card}
          editor={editor}
          job={job}
          className="pointer-events-auto absolute inset-x-0 bottom-3 mx-auto max-h-[50svh] w-full max-w-2xl"
        />
      </div>
    )

  return (
    <>
      {highlight}
      <AiCard
        ref={card}
        editor={editor}
        job={job}
        style={
          pos
            ? { top: pos.top, left: pos.left }
            : { top: 0, left: 0, visibility: "hidden" }
        }
        className="absolute z-30 max-h-[min(28rem,60svh)] w-[min(30rem,100%)]"
      />
    </>
  )
}

function AiCard({
  editor,
  job,
  className,
  style,
  ref,
}: {
  editor: Editor
  job: AiJob
  className?: string
  style?: React.CSSProperties
  ref: React.Ref<HTMLElement>
}) {
  const t = useT("ai")
  const label = useActionLabel()
  const store = storeOf(editor)
  const result = cleanResult(job.result)
  // A summary leaves links and pictures out on purpose.
  const lost =
    job.status === "done" && job.action !== "summarize"
      ? lostUrls(job.source, result)
      : []
  const errorText =
    job.error === "not_configured"
      ? t("errNotConfigured")
      : job.error === "rate_limited"
        ? t("errRateLimited")
        : job.error === "too_long"
          ? t("errTooLong")
          : job.error === "unauthorized"
            ? t("errUnauthorized")
            : job.error === "empty"
              ? t("errEmpty")
              : job.error === "bad_request" && !job.source.trim()
                ? t("emptyDoc")
                : t("errFailed")
  const close = () => {
    store.clear()
    editor.view.focus()
  }
  const done = (mode: "replace" | "below" | "top") => {
    if (!apply(editor, job, mode)) return
    // Back to the text before the card (and its focused button) goes, so
    // the dialog doesn't take focus and ⌘Z undoes right away.
    editor.view.focus()
    store.set(null)
  }
  const retry = () =>
    startAi(
      editor,
      job.scope,
      {
        action: job.action,
        language: job.language,
        instruction: job.instruction,
      },
      job.scope === "doc"
        ? undefined
        : {
            from: job.from,
            to: job.to,
            inline: job.inline,
            source: job.source,
          },
    )

  return (
    <section
      ref={ref}
      style={style}
      aria-label={t("aiTitle")}
      aria-busy={job.status === "streaming"}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return
        // Only the card closes, not the dialog around it.
        e.stopPropagation()
        close()
      }}
      className={cn(
        "bg-popover text-popover-foreground rounded-popover shadow-popover flex flex-col overflow-hidden",
        className,
      )}
    >
      <header className="flex shrink-0 items-center gap-2 pt-2.5 pr-2 pb-1 pl-4">
        <Sparkles className="text-primary size-4 shrink-0" />
        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          {t("resultFor", { action: label(job) })}
          <span className="text-muted-foreground font-normal">
            {" · "}
            {t(job.scope === "doc" ? "scopeDoc" : "scopeSelection")}
          </span>
        </p>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t("close")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={close}
        >
          <X />
        </Button>
      </header>
      <div className="scroll-pane pane-px-4 min-h-0 flex-1">
        {job.status === "error" ? (
          <p
            role="alert"
            className="text-destructive-ink flex items-start gap-2 py-2 text-sm"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {errorText}
          </p>
        ) : result ? (
          <Markdown
            images
            className="text-sm leading-6 [&_img]:max-h-32 [&_img]:w-auto [&_img]:max-w-full [&_p]:my-1.5"
          >
            {result}
          </Markdown>
        ) : (
          <p className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
            <Spinner />
            {t("working")}
          </p>
        )}
        {lost.length > 0 && (
          <p className="text-meta text-warning-ink flex items-start gap-2 pb-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {t("urlsChanged")}
          </p>
        )}
      </div>
      <footer className="border-border flex shrink-0 flex-wrap items-center gap-1.5 border-t px-3 py-2">
        {job.status === "streaming" ? (
          <>
            {result && (
              <span className="text-muted-foreground flex items-center gap-2 pl-1 text-xs">
                <Spinner />
                {t("working")}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onMouseDown={(e) => e.preventDefault()}
              onClick={close}
            >
              <Square data-icon="inline-start" />
              {t("stop")}
            </Button>
          </>
        ) : (
          <>
            {job.status === "done" && job.action === "summarize" && (
              <>
                <Button size="sm" onClick={() => done("top")}>
                  <ArrowUpToLine data-icon="inline-start" />
                  {t("insertTop")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(result)
                      .then(() => toast.success(t("copied")))
                      .catch(() => {})
                  }
                >
                  <Copy data-icon="inline-start" />
                  {t("copy")}
                </Button>
              </>
            )}
            {job.status === "done" && job.action !== "summarize" && (
              <>
                <Button size="sm" onClick={() => done("replace")}>
                  {t("replace")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => done("below")}
                >
                  {t("insertBelow")}
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={retry}>
              <RotateCcw data-icon="inline-start" />
              {t("retry")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onMouseDown={(e) => e.preventDefault()}
              onClick={close}
            >
              {t("discard")}
            </Button>
          </>
        )}
      </footer>
    </section>
  )
}
