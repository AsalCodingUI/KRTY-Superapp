"use client"

import { CALLOUT_STYLE, CalloutBox } from "@/components/callout-box"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import {
  CALLOUT_TONES,
  calloutMarker,
  isCalloutTone,
  toneOfMarker,
  type CalloutTone,
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
import { Check, MessageSquareWarning } from "@/components/icons"
import type { BlockItem } from "./slash-command"

/*
 * Callout: a tinted box with its tone's icon, holding any blocks. In
 * Markdown a GitHub alert, `> [!NOTE]` / `[!TIP]` / `[!WARNING]` /
 * `[!CAUTION]` (see shared/lib/doc-blocks). The icon opens the tone menu.
 */

const TONE_LABEL = {
  neutral: "toneNeutral",
  info: "toneInfo",
  success: "toneSuccess",
  warning: "toneWarning",
  danger: "toneDanger",
} as const

/** "> [!NOTE]" and the "> " lines after it, up to the first other line. */
const CALLOUT_START =
  /(?:^|\n) {0,3}> ?\[!(?:NEUTRAL|NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\n|$)/i
const CALLOUT_HEAD =
  /^ {0,3}> ?\[!(NEUTRAL|NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\n|$)/i

function CalloutView({ node, editor, getPos }: NodeViewProps) {
  const t = useT("policies")
  const tone: CalloutTone = isCalloutTone(node.attrs.tone)
    ? node.attrs.tone
    : "info"
  const Icon = CALLOUT_STYLE[tone].icon

  const setTone = (next: CalloutTone) => {
    const pos = getPos()
    if (typeof pos !== "number") return
    editor
      .chain()
      .command(({ tr }) => {
        tr.setNodeAttribute(pos, "tone", next)
        return true
      })
      .run()
  }

  const icon = editor.isEditable ? (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("calloutTone")}
        onMouseDown={(e) => e.stopPropagation()}
        className="hover:bg-foreground/[0.06] -m-1 grid size-7 place-items-center rounded-md transition-colors"
      >
        <Icon className="size-[18px]" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {CALLOUT_TONES.map((c) => {
          const ToneIcon = CALLOUT_STYLE[c].icon
          return (
            <DropdownMenuItem
              key={c}
              onClick={() => setTone(c)}
              className="gap-2.5"
            >
              <ToneIcon className={cn("size-4", CALLOUT_STYLE[c].ink)} />
              <span className="flex-1">{t(TONE_LABEL[c])}</span>
              {c === tone && <Check className="text-muted-foreground size-4" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : undefined

  return (
    <NodeViewWrapper className="doc-callout">
      <CalloutBox tone={tone} icon={icon}>
        <NodeViewContent />
      </CalloutBox>
    </NodeViewWrapper>
  )
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  draggable: true,

  addAttributes() {
    return {
      tone: {
        default: "info",
        parseHTML: (el) => {
          const v = el.getAttribute("data-callout")
          return isCalloutTone(v) ? v : "info"
        },
        renderHTML: (attrs) => ({ "data-callout": attrs.tone as string }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0]
  },

  markdownTokenName: "callout",
  markdownTokenizer: {
    name: "callout",
    level: "block",
    start: (src: string) => {
      const m = CALLOUT_START.exec(src)
      return m ? m.index + (m[0].startsWith("\n") ? 1 : 0) : -1
    },
    tokenize: (src, _tokens, lexer) => {
      const head = CALLOUT_HEAD.exec(src)
      const tone = head && toneOfMarker(head[1])
      if (!head || !tone) return undefined
      // The quote's other lines: each starts with ">".
      const lines: string[] = []
      let offset = head[0].length
      while (offset < src.length) {
        const nl = src.indexOf("\n", offset)
        const line = src.slice(offset, nl === -1 ? src.length : nl)
        if (!/^ {0,3}>/.test(line)) break
        lines.push(line.replace(/^ {0,3}> ?/, ""))
        offset = nl === -1 ? src.length : nl + 1
      }
      const raw = src.slice(0, offset)
      const inner = lines.join("\n")
      return {
        type: "callout",
        raw,
        tone,
        tokens: inner.trim() ? lexer.blockTokens(inner) : [],
      }
    },
  },
  parseMarkdown: (token, helpers) => {
    const parse = helpers.parseBlockChildren ?? helpers.parseChildren
    const content = parse(token.tokens ?? [])
    return helpers.createNode(
      "callout",
      { tone: token.tone as string },
      content.length ? content : [{ type: "paragraph" }],
    )
  },
  renderMarkdown: (node: JSONContent, h) => {
    const tone = isCalloutTone(node.attrs?.tone) ? node.attrs.tone : "info"
    const body = (node.content ?? [])
      .map((child, i) =>
        h.renderChild ? h.renderChild(child, i) : h.renderChildren([child]),
      )
      .join("\n\n")
    const lines = body
      .split("\n")
      .map((line) => (line.trim() === "" ? ">" : `> ${line}`))
    return [`> ${calloutMarker(tone)}`, ...lines].join("\n")
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },

  addKeyboardShortcuts() {
    return {
      // Backspace at the very start of a callout: its blocks come out of it.
      Backspace: ({ editor }) => {
        const { selection } = editor.state
        const { $from, empty } = selection
        if (!empty || $from.parentOffset !== 0) return false
        const d = $from.depth - 1
        const n = $from.node(d)
        if (d < 1 || n.type.name !== this.name || $from.index(d) !== 0)
          return false
        const start = $from.before(d)
        return editor
          .chain()
          .command(({ tr }) => {
            tr.replaceWith(start, start + n.nodeSize, n.content)
            tr.setSelection(TextSelection.create(tr.doc, start + 1))
            return true
          })
          .run()
      },
    }
  },
})

/** The "/" item: an info callout with an empty line to write in. */
export const CALLOUT_SLASH_ITEM: BlockItem = {
  id: "callout",
  title: "blockCallout",
  hint: "blockCalloutHint",
  keywords:
    "callout info note catatan tips peringatan warning bahaya danger alert kotak highlight sukses",
  icon: MessageSquareWarning,
  run: (e, r) => {
    const chain = e.chain().focus()
    if (r) chain.deleteRange(r)
    chain
      .command(({ tr, state }) => {
        const { $from } = tr.selection
        if ($from.depth === 0) return false
        const { callout, paragraph } = state.schema.nodes
        // What the line already says goes in the callout.
        const inner = $from.parent.isTextblock
          ? paragraph.create(null, $from.parent.content)
          : paragraph.create()
        const node = callout.create({ tone: "info" }, inner)
        const from = $from.before()
        if ($from.parent.isTextblock) tr.replaceWith(from, $from.after(), node)
        else tr.insert($from.after(), node)
        tr.setSelection(
          TextSelection.create(tr.doc, from + 2 + inner.content.size),
        )
        return true
      })
      .run()
  },
}
