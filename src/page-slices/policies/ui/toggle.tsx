"use client"

import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import {
  DETAILS_CLOSE,
  DETAILS_OPEN,
  escapeSummary,
  unescapeSummary,
} from "@/shared/lib/doc-blocks"
import { TextSelection } from "@tiptap/pm/state"
import {
  Node,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type JSONContent,
  type NodeViewProps,
} from "@tiptap/react"
import { ChevronRight, ListCollapse } from "lucide-react"
import { useEffect, useState } from "react"
import type { BlockItem } from "./slash-command"

/*
 * Toggle: a summary line that opens and closes the blocks under it. In
 * Markdown an HTML details element (see shared/lib/doc-blocks):
 *
 *   <details>
 *   <summary>Judul</summary>
 *
 *   …blocks…
 *
 *   </details>
 *
 * The schema is toggle → toggleSummary (plain text) + toggleBody (blocks).
 * Whether it's open isn't saved: a loaded toggle starts closed (so a
 * reader sees it folded), a new one starts open to write in.
 */

/** "<details>" + "<summary>…</summary>" opening a toggle. */
const HEAD =
  /^ {0,3}<details(?:\s[^>]*)?>[ \t]*\n?[ \t]*<summary>([\s\S]*?)<\/summary>[ \t]*(?:\n|$)/i
const START = /(?:^|\n) {0,3}<details(?:\s[^>]*)?>/i

/**
 * Where a toggle's body ends in `src` (just after its own "</details>"
 * line), skipping nested toggles and code fences. -1 when it never does.
 */
function bodyEnd(src: string): { body: string; end: number } | null {
  let depth = 0
  let fence: string | null = null
  let offset = 0
  while (offset < src.length) {
    const nl = src.indexOf("\n", offset)
    const lineEnd = nl === -1 ? src.length : nl
    const line = src.slice(offset, lineEnd).trim()
    const next = nl === -1 ? src.length : nl + 1
    const f = /^(`{3,}|~{3,})/.exec(line)?.[1]
    if (fence) {
      if (f && f[0] === fence[0] && f.length >= fence.length) fence = null
    } else if (f) fence = f
    else if (DETAILS_OPEN.test(line)) depth++
    else if (DETAILS_CLOSE.test(line)) {
      if (depth === 0) return { body: src.slice(0, offset), end: next }
      depth--
    }
    offset = next
  }
  return null
}

function ToggleView({ node, editor, getPos }: NodeViewProps) {
  const t = useT("policies")
  const [open, setOpen] = useState(Boolean(node.attrs.open))
  useEffect(() => setOpen(Boolean(node.attrs.open)), [node.attrs.open])

  const flip = () => {
    const next = !open
    setOpen(next)
    const pos = getPos()
    if (!editor.isEditable || typeof pos !== "number") return
    // Opening and closing isn't an edit: no undo step, nothing saved.
    const tr = editor.state.tr
      .setNodeAttribute(pos, "open", next)
      .setMeta("addToHistory", false)
    editor.view.dispatch(tr)
  }

  return (
    <NodeViewWrapper
      className={cn(
        "doc-toggle relative my-2",
        // The summary's hint while it's empty (a CSS string in --toggle-ph).
        "[&_.doc-toggle-summary:has(>br:only-child)]:before:text-muted-foreground/60 [&_.doc-toggle-summary:has(>br:only-child)]:before:pointer-events-none [&_.doc-toggle-summary:has(>br:only-child)]:before:float-left [&_.doc-toggle-summary:has(>br:only-child)]:before:h-0 [&_.doc-toggle-summary:has(>br:only-child)]:before:content-(--toggle-ph)",
        "[&_.doc-toggle-summary]:text-foreground [&_.doc-toggle-summary]:font-medium",
      )}
      data-open={open ? "true" : "false"}
      style={
        {
          "--toggle-ph": JSON.stringify(t("toggleSummaryPlaceholder")),
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        contentEditable={false}
        aria-expanded={open}
        aria-label={t(open ? "toggleClose" : "toggleOpen")}
        onMouseDown={(e) => e.preventDefault()}
        onClick={flip}
        className="text-muted-foreground hover:text-foreground hover:bg-muted absolute top-0.5 left-0 grid size-6 place-items-center rounded-md transition-colors"
      >
        <ChevronRight
          className={cn(
            "size-4 transition-transform duration-150",
            open && "rotate-90",
          )}
        />
      </button>
      <NodeViewContent
        className={cn(
          "pl-7 [&_.doc-toggle-body>*:first-child]:mt-1 [&_.doc-toggle-body>*:last-child]:mb-1 [&_.doc-toggle-body>p]:my-2",
          // Hidden body while closed (a nested toggle hides only its own).
          "[[data-open=false]>&_.doc-toggle-body]:hidden",
        )}
      />
    </NodeViewWrapper>
  )
}

export const ToggleSummary = Node.create({
  name: "toggleSummary",
  content: "text*",
  marks: "",
  defining: true,
  parseHTML() {
    return [{ tag: "div[data-toggle-summary]" }, { tag: "summary" }]
  },
  renderHTML() {
    return [
      "div",
      { "data-toggle-summary": "", class: "doc-toggle-summary" },
      0,
    ]
  },
})

export const ToggleBody = Node.create({
  name: "toggleBody",
  content: "block+",
  defining: true,
  parseHTML() {
    return [{ tag: "div[data-toggle-body]" }]
  },
  renderHTML() {
    return ["div", { "data-toggle-body": "", class: "doc-toggle-body" }, 0]
  },
})

export const Toggle = Node.create({
  name: "toggle",
  group: "block",
  content: "toggleSummary toggleBody",
  defining: true,
  draggable: true,

  addAttributes() {
    // Not saved (Markdown has no place for it); see the top of the file.
    return { open: { default: false, rendered: false } }
  },

  parseHTML() {
    return [{ tag: "div[data-toggle]" }]
  },

  renderHTML() {
    return ["div", { "data-toggle": "" }, 0]
  },

  markdownTokenName: "toggle",
  markdownTokenizer: {
    name: "toggle",
    level: "block",
    start: (src: string) => {
      const m = START.exec(src)
      return m ? m.index + (m[0].startsWith("\n") ? 1 : 0) : -1
    },
    tokenize: (src, _tokens, lexer) => {
      const head = HEAD.exec(src)
      if (!head) return undefined
      const rest = src.slice(head[0].length)
      const found = bodyEnd(rest)
      if (!found) return undefined
      let raw = src.slice(0, head[0].length + found.end)
      // The blank lines after it belong to it too.
      raw += /^\n*/.exec(src.slice(raw.length))?.[0] ?? ""
      return {
        type: "toggle",
        raw,
        summary: unescapeSummary(head[1]),
        tokens: found.body.trim() ? lexer.blockTokens(found.body) : [],
      }
    },
  },
  parseMarkdown: (token, helpers) => {
    const parse = helpers.parseBlockChildren ?? helpers.parseChildren
    const content = parse(token.tokens ?? [])
    const summary = String(token.summary ?? "")
    return helpers.createNode("toggle", { open: false }, [
      helpers.createNode(
        "toggleSummary",
        undefined,
        summary ? [helpers.createTextNode(summary)] : [],
      ),
      helpers.createNode(
        "toggleBody",
        undefined,
        content.length ? content : [{ type: "paragraph" }],
      ),
    ])
  },
  renderMarkdown: (node: JSONContent, h) => {
    const [summary, body] = node.content ?? []
    const title = (summary?.content ?? []).map((c) => c.text ?? "").join("")
    const inner = (body?.content ?? [])
      .map((child, i) =>
        h.renderChild ? h.renderChild(child, i) : h.renderChildren([child]),
      )
      .filter((s) => s.trim() !== "")
      .join("\n\n")
    return [
      "<details>",
      `<summary>${escapeSummary(title.replace(/\s*\n\s*/g, " "))}</summary>`,
      "",
      ...(inner ? [inner, ""] : []),
      "</details>",
    ].join("\n")
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleView)
  },

  addKeyboardShortcuts() {
    const inSummary = () => {
      const { $from, empty } = this.editor.state.selection
      return empty && $from.parent.type.name === "toggleSummary" ? $from : null
    }
    return {
      // Enter on the summary: opens it and starts a line at the top of
      // the body.
      Enter: ({ editor }) => {
        const $from = inSummary()
        if (!$from) return false
        const togglePos = $from.before($from.depth - 1)
        const summaryEnd = $from.after()
        return editor
          .chain()
          .command(({ tr, state }) => {
            tr.setNodeAttribute(togglePos, "open", true)
            // summaryEnd is the body's start; +1 is inside it.
            tr.insert(summaryEnd + 1, state.schema.nodes.paragraph.create())
            tr.setSelection(TextSelection.create(tr.doc, summaryEnd + 2))
            return true
          })
          .scrollIntoView()
          .run()
      },
      // Backspace at the start of the summary: the toggle comes apart into
      // a line and the blocks that were in it.
      Backspace: ({ editor }) => {
        const $from = inSummary()
        if (!$from || $from.parentOffset !== 0) return false
        const toggle = $from.node($from.depth - 1)
        const start = $from.before($from.depth - 1)
        const [summary, body] = [toggle.child(0), toggle.child(1)]
        const { paragraph } = editor.schema.nodes
        const blocks = [paragraph.create(null, summary.content)]
        body.forEach((b) => {
          if (!(b.type === paragraph && b.content.size === 0)) blocks.push(b)
        })
        return editor
          .chain()
          .command(({ tr }) => {
            tr.replaceWith(start, start + toggle.nodeSize, blocks)
            tr.setSelection(TextSelection.create(tr.doc, start + 1))
            return true
          })
          .run()
      },
    }
  },
})

/** The "/" item: an open toggle, the caret on its summary. */
export const TOGGLE_SLASH_ITEM: BlockItem = {
  id: "toggle",
  title: "blockToggle",
  hint: "blockToggleHint",
  keywords: "toggle details lipat buka tutup collapse accordion dropdown",
  icon: ListCollapse,
  run: (e, r) => {
    const chain = e.chain().focus()
    if (r) chain.deleteRange(r)
    chain
      .command(({ tr, state }) => {
        const { $from } = tr.selection
        if ($from.depth === 0) return false
        const { toggle, toggleSummary, toggleBody, paragraph } =
          state.schema.nodes
        // What the line already says becomes the summary.
        const text = $from.parent.isTextblock ? $from.parent.textContent : ""
        const node = toggle.create({ open: true }, [
          toggleSummary.create(null, text ? state.schema.text(text) : null),
          toggleBody.create(null, paragraph.create()),
        ])
        const from = $from.before()
        if ($from.parent.isTextblock) tr.replaceWith(from, $from.after(), node)
        else tr.insert($from.after(), node)
        tr.setSelection(TextSelection.create(tr.doc, from + 2 + text.length))
        return true
      })
      .run()
  },
}

/** The toggle's three nodes, for the editor's extensions. */
export const TOGGLE_NODES = [Toggle, ToggleSummary, ToggleBody]
