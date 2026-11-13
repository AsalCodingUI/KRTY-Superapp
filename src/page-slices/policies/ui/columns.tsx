"use client"

import { TextSelection } from "@tiptap/pm/state"
import { Node, type JSONContent } from "@tiptap/react"
import { Columns2, Columns3 } from "@/components/icons"
import type { BlockItem } from "./slash-command"

/*
 * Columns, as Notion's: blocks side by side (2 or 3), each column holding
 * any blocks. In Markdown, HTML divs around Markdown (like the toggle's
 * details):
 *
 *   <div data-columns>
 *   <div data-column>
 *
 *   …blocks…
 *
 *   </div>
 *   <div data-column>
 *
 *   …blocks…
 *
 *   </div>
 *   </div>
 *
 * Phones stack them.
 */

const COLUMNS_OPEN = /^ {0,3}<div\s+data-columns\s*>\s*$/i
const COLUMN_OPEN = /^ {0,3}<div\s+data-column\s*>\s*$/i
const DIV_CLOSE = /^ {0,3}<\/div>\s*$/i
const START = /(?:^|\n) {0,3}<div\s+data-columns\s*>/i

type Parsed = { columns: string[]; end: number }

/** The columns' bodies in `src` (which starts at "<div data-columns>"),
 *  and where the block ends; null when it's not well formed. */
function parseColumns(src: string): Parsed | null {
  const lines: { text: string; start: number; next: number }[] = []
  let offset = 0
  while (offset < src.length) {
    const nl = src.indexOf("\n", offset)
    const end = nl === -1 ? src.length : nl
    lines.push({
      text: src.slice(offset, end),
      start: offset,
      next: nl === -1 ? src.length : nl + 1,
    })
    offset = nl === -1 ? src.length : nl + 1
  }
  if (!lines.length || !COLUMNS_OPEN.test(lines[0].text)) return null
  const columns: string[] = []
  let i = 1
  let fence: string | null = null
  while (i < lines.length) {
    const line = lines[i].text.trim()
    if (!line) {
      i++
      continue
    }
    if (DIV_CLOSE.test(line)) return { columns, end: lines[i].next }
    if (!COLUMN_OPEN.test(line)) return null
    // A column: its body up to its own "</div>" (nested divs counted).
    const bodyStart = lines[i].next
    let depth = 0
    let j = i + 1
    let closed = -1
    for (; j < lines.length; j++) {
      const text = lines[j].text.trim()
      const f = /^(`{3,}|~{3,})/.exec(text)?.[1]
      if (fence) {
        if (f && f[0] === fence[0] && f.length >= fence.length) fence = null
        continue
      }
      if (f) {
        fence = f
        continue
      }
      if (/^<div[\s>]/i.test(text)) depth++
      else if (DIV_CLOSE.test(text)) {
        if (depth === 0) {
          closed = j
          break
        }
        depth--
      }
    }
    if (closed === -1) return null
    columns.push(src.slice(bodyStart, lines[closed].start))
    i = closed + 1
  }
  return null
}

export const Column = Node.create({
  name: "column",
  content: "block+",
  defining: true,
  isolating: true,
  parseHTML() {
    return [{ tag: "div[data-column]" }]
  },
  renderHTML() {
    return [
      "div",
      {
        "data-column": "",
        class:
          "doc-column min-w-0 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
      },
      0,
    ]
  },
})

export const Columns = Node.create({
  name: "columns",
  group: "block",
  content: "column column+",
  defining: true,
  draggable: true,

  parseHTML() {
    return [{ tag: "div[data-columns]" }]
  },
  // Equal columns however many (auto-flow), stacked on phones.
  renderHTML() {
    return [
      "div",
      {
        "data-columns": "",
        class:
          "doc-columns my-3 grid auto-cols-[minmax(0,1fr)] grid-flow-col gap-6 max-sm:grid-flow-row",
      },
      0,
    ]
  },

  markdownTokenName: "columns",
  markdownTokenizer: {
    name: "columns",
    level: "block",
    start: (src: string) => {
      const m = START.exec(src)
      return m ? m.index + (m[0].startsWith("\n") ? 1 : 0) : -1
    },
    tokenize: (src, _tokens, lexer) => {
      const parsed = parseColumns(src)
      if (!parsed || parsed.columns.length < 2) return undefined
      let raw = src.slice(0, parsed.end)
      raw += /^\n*/.exec(src.slice(raw.length))?.[0] ?? ""
      return {
        type: "columns",
        raw,
        columns: parsed.columns.map((body) =>
          body.trim() ? lexer.blockTokens(body) : [],
        ),
      }
    },
  },
  parseMarkdown: (token, helpers) => {
    const parse = helpers.parseBlockChildren ?? helpers.parseChildren
    const columns = (token.columns as unknown[][]).map((tokens) => {
      const content = parse(tokens as never[])
      return helpers.createNode(
        "column",
        undefined,
        content.length ? content : [{ type: "paragraph" }],
      )
    })
    return helpers.createNode("columns", undefined, columns)
  },
  renderMarkdown: (node: JSONContent, h) => {
    const columns = (node.content ?? []).map((column) => {
      const inner = (column.content ?? [])
        .map((child, i) =>
          h.renderChild ? h.renderChild(child, i) : h.renderChildren([child]),
        )
        .filter((s) => s.trim() !== "")
        .join("\n\n")
      return [
        "<div data-column>",
        "",
        ...(inner ? [inner, ""] : []),
        "</div>",
      ].join("\n")
    })
    return ["<div data-columns>", ...columns, "</div>"].join("\n")
  },

})

/** "/" items: 2 or 3 empty columns, the caret in the first. */
const columnsItem = (count: 2 | 3): BlockItem => ({
  id: `columns-${count}`,
  title: count === 2 ? "blockColumns2" : "blockColumns3",
  hint: "blockColumnsHint",
  keywords: `kolom columns ${count} layout side`,
  icon: count === 2 ? Columns2 : Columns3,
  run: (e, r) => {
    const chain = e.chain().focus()
    if (r) chain.deleteRange(r)
    chain
      .command(({ tr, state }) => {
        const { $from } = tr.selection
        if ($from.depth === 0) return false
        const { columns, column, paragraph } = state.schema.nodes
        const node = columns.create(
          null,
          Array.from({ length: count }, () =>
            column.create(null, paragraph.create()),
          ),
        )
        const empty =
          $from.parent.isTextblock && $from.parent.content.size === 0
        const from = empty ? $from.before() : $from.after()
        if (empty) tr.replaceWith(from, $from.after(), node)
        else tr.insert(from, node)
        // columns > column > paragraph: three steps in.
        tr.setSelection(TextSelection.create(tr.doc, from + 3))
        return true
      })
      .run()
  },
})

export const COLUMNS_SLASH_ITEMS: BlockItem[] = [columnsItem(2), columnsItem(3)]

export const COLUMN_NODES = [Columns, Column]
