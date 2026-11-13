"use client"

import {
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type JSONContent,
  type NodeViewProps,
} from "@tiptap/react"
import { useContext } from "react"
import { PageLinkContext } from "./page-link-context"

/*
 * Page link: a link to one of the app's own pages alone on its line, as
 * Notion's "link to page" (and, for a database, the database itself). In
 * Markdown it stays a plain link on its own line, so every reader still
 * reads it:
 *
 *   [Liburan Archive](/wiki/liburan-archive-678787b3)
 *
 * Only /wiki/ addresses (the pages that have a chip); a link inside a
 * sentence stays a link.
 */

const LINE = /^ {0,3}\[([^\]\n]+)\]\((\/wiki\/[^)\s]+)\)[ \t]*(?:\n|$)/
const START = /(?:^|\n) {0,3}\[[^\]\n]+\]\(\/wiki\/[^)\s]+\)[ \t]*(?:\n|$)/

function PageLinkView({ node }: NodeViewProps) {
  const render = useContext(PageLinkContext)
  const href = String(node.attrs.href ?? "")
  const title = String(node.attrs.title ?? "")
  return (
    // data-embed: the editor's link click handler leaves it to the view.
    <NodeViewWrapper data-embed="" className="my-1" contentEditable={false}>
      {render?.(href, title) ?? (
        <a href={href} className="text-primary underline">
          {title}
        </a>
      )}
    </NodeViewWrapper>
  )
}

export const PageLink = Node.create({
  name: "pageLink",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return { href: { default: "" }, title: { default: "" } }
  },
  parseHTML() {
    return [{ tag: "div[data-page-link]" }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-page-link": "", ...HTMLAttributes }]
  },

  markdownTokenName: "pageLink",
  markdownTokenizer: {
    name: "pageLink",
    level: "block",
    start: (src: string) => {
      const m = START.exec(src)
      return m ? m.index + (m[0].startsWith("\n") ? 1 : 0) : -1
    },
    tokenize: (src: string) => {
      const m = LINE.exec(src)
      if (!m) return undefined
      // LINE matches the whole line: nothing else on it.
      return { type: "pageLink", raw: m[0], title: m[1], href: m[2] }
    },
  },
  parseMarkdown: (token, helpers) =>
    helpers.createNode("pageLink", {
      href: String(token.href ?? ""),
      title: String(token.title ?? ""),
    }),
  renderMarkdown: (node: JSONContent) =>
    `[${String(node.attrs?.title ?? "").replace(/[[\]]/g, "\\$&")}](${String(node.attrs?.href ?? "")})`,

  addNodeView() {
    // What's inside (a database's cells, its menus) handles its own keys,
    // clicks and typing: the editor stays out (End, arrows, Enter…).
    return ReactNodeViewRenderer(PageLinkView, { stopEvent: () => true })
  },
})
