"use client"

import { EmbedBlock } from "@/components/embed-block"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import {
  embedHref,
  embedInfo,
  fallbackTitle,
  normalizeUrl,
  parseEmbedHref,
  type EmbedView,
} from "@/shared/lib/embeds"
import type { Node as PMNode } from "@tiptap/pm/model"
import {
  NodeSelection,
  Plugin,
  PluginKey,
  TextSelection,
  type EditorState,
} from "@tiptap/pm/state"
import {
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditorState,
  type Editor,
  type NodeViewProps,
} from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { AppWindow } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { BlockItem } from "./slash-command"

/*
 * Embeds: a link shown as a card or a live preview (Figma, Google Drive /
 * Docs / Sheets / Slides, YouTube, Loom, Vimeo; any other link as a card).
 * In Markdown it's a paragraph holding only the link, its version in the
 * URL fragment: `[Title](https://…#embed=card|preview-small|preview-wide)`
 * (see shared/lib/embeds). The plain "Link" version is an ordinary link.
 *
 * In they go from "/" (a field to paste the link into) or by pasting a
 * known service's link on an empty line, which goes in as a link with the
 * versions offered above it.
 */

/** One embed line in Markdown: `[text](https://…#embed=view)` on its own. */
const EMBED_LINE =
  /^\[((?:\\.|[^\\\]\n])*)\]\(<?(https?:\/\/[^\s<>]+?#embed=(?:card|preview-small|preview-wide))>?\)[ \t]*(?:\n+|$)/
const EMBED_LINE_START =
  /(?:^|\n)\[(?:\\.|[^\\\]\n])*\]\(<?https?:\/\/[^\s<>]+?#embed=(?:card|preview-small|preview-wide)>?\)[ \t]*(?:\n|$)/

const escapeText = (s: string) => s.replace(/([\\[\]])/g, "\\$1")
const unescapeText = (s: string) => s.replace(/\\(.)/g, "$1")
// Parentheses and spaces would end the link early.
const escapeHref = (s: string) =>
  s.replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/ /g, "%20")

/** Titles already asked for this session (found or not). */
const asked = new Set<string>()

async function fetchTitle(url: string) {
  if (asked.has(url)) return null
  asked.add(url)
  try {
    const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
    if (!res.ok) return null
    const data = (await res.json()) as { title?: string | null }
    return data.title?.trim() || null
  } catch {
    return null
  }
}

function EmbedNodeView({
  node,
  editor,
  updateAttributes,
  deleteNode,
  getPos,
}: NodeViewProps) {
  const t = useT("policies")
  const url = node.attrs.url as string
  const title = node.attrs.title as string
  const view = node.attrs.view as EmbedView
  const editable = editor.isEditable

  // A fresh link: look up its page title for the card.
  useEffect(() => {
    if (!url || title || !editable) return
    let live = true
    void fetchTitle(url).then((found) => {
      if (live && found) updateAttributes({ title: found })
    })
    return () => {
      live = false
    }
  }, [url, title, editable, updateAttributes])

  if (!url) {
    if (!editable) return <NodeViewWrapper />
    return (
      <NodeViewWrapper contentEditable={false}>
        <EmbedInput
          placeholder={t("embedPlaceholder")}
          invalid={t("embedInvalid")}
          onSubmit={(link) => {
            const next = embedInfo(link).src ? "preview-wide" : "card"
            updateAttributes({ url: link, view: next })
            // Picked, so its versions show straight away (Enter goes on
            // below it).
            const pos = getPos()
            if (typeof pos === "number")
              editor.chain().focus().setNodeSelection(pos).run()
          }}
          onCancel={() => {
            deleteNode()
            editor.commands.focus()
          }}
        />
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className="doc-embed">
      <EmbedBlock url={url} title={title} view={view} editing={editable} />
    </NodeViewWrapper>
  )
}

function EmbedInput({
  placeholder,
  invalid,
  onSubmit,
  onCancel,
}: {
  placeholder: string
  invalid: string
  onSubmit: (url: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState("")
  const [error, setError] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    // After the "/" menu has closed and the editor has taken focus back
    // (Tiptap focuses on the next frame), so the field keeps it.
    let timer = 0
    const frame = requestAnimationFrame(() => {
      timer = window.setTimeout(() => ref.current?.focus(), 30)
    })
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [])
  const submit = () => {
    const url = normalizeUrl(value)
    if (!url) return setError(true)
    onSubmit(url)
  }
  return (
    <div className="my-3">
      <div
        className={cn(
          "border-border bg-muted/40 focus-within:border-foreground/20 flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors",
          error && "border-destructive/60",
        )}
      >
        <AppWindow className="text-muted-foreground size-4 shrink-0" />
        <input
          ref={ref}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              submit()
            } else if (
              e.key === "Escape" ||
              ((e.key === "Backspace" || e.key === "Delete") && !value)
            ) {
              // Esc, or erasing an empty field, takes the block away.
              e.preventDefault()
              onCancel()
            }
          }}
          onBlur={() => {
            if (!value.trim()) onCancel()
          }}
          placeholder={placeholder}
          inputMode="url"
          // Borderless inside the card: no box or focus ring of its own.
          className="text-foreground placeholder:text-muted-foreground/70 m-0 h-6 min-w-0 flex-1 appearance-none rounded-none border-0! bg-transparent! p-0 text-sm leading-6 shadow-none! ring-0! outline-none! focus:ring-0! focus:outline-none! focus-visible:ring-0! focus-visible:outline-none!"
        />
      </div>
      {error && (
        <div className="text-destructive mt-1 px-1 text-xs leading-5">
          {invalid}
        </div>
      )}
    </div>
  )
}

/** Where a pasted link is being offered as an embed (its paragraph). */
const offerKey = new PluginKey<number | null>("embedOffer")

/** The link a paragraph holds, when it holds nothing else. */
function onlyLink(node: PMNode | null | undefined) {
  if (!node || node.type.name !== "paragraph" || node.childCount !== 1)
    return null
  const text = node.firstChild
  const link = text?.marks.find((m) => m.type.name === "link")
  const href = link?.attrs.href as string | undefined
  if (!text?.isText || !href || !normalizeUrl(href)) return null
  return { href, text: text.text ?? "" }
}

function offerAt(state: EditorState) {
  const pos = offerKey.getState(state)
  if (pos == null) return null
  const node = state.doc.nodeAt(pos)
  const link = onlyLink(node)
  return node && link ? { pos, node, ...link } : null
}

export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  // Ahead of the link extension's own paste handling, but after the
  // paragraph (1000): the schema's first block is what an empty doc gets.
  priority: 999,

  addAttributes() {
    return {
      url: { default: "" },
      title: { default: "" },
      view: { default: "card" },
    }
  },

  parseHTML() {
    return [
      {
        tag: "div[data-embed]",
        getAttrs: (el) => {
          const href = (el as HTMLElement).querySelector("a")?.href
          const parsed = parseEmbedHref(href)
          if (!parsed) return false
          return {
            url: parsed.url,
            view: parsed.view,
            title: (el as HTMLElement).textContent?.trim() ?? "",
          }
        },
      },
    ]
  },

  renderHTML({ node }) {
    const url = node.attrs.url as string
    return [
      "div",
      { "data-embed": "" },
      [
        "a",
        { href: url ? embedHref(url, node.attrs.view as EmbedView) : "" },
        (node.attrs.title as string) || url,
      ],
    ]
  },

  markdownTokenName: "embed",
  markdownTokenizer: {
    name: "embed",
    level: "block",
    start: (src: string) => {
      const m = EMBED_LINE_START.exec(src)
      return m ? m.index + (m[0].startsWith("\n") ? 1 : 0) : -1
    },
    tokenize: (src: string) => {
      const m = EMBED_LINE.exec(src)
      const parsed = m && parseEmbedHref(m[2])
      if (!m || !parsed) return undefined
      return {
        type: "embed",
        raw: m[0],
        url: parsed.url,
        view: parsed.view,
        title: unescapeText(m[1]),
      }
    },
  },
  parseMarkdown: (token, helpers) =>
    helpers.createNode("embed", {
      url: token.url as string,
      view: token.view as string,
      title: token.title as string,
    }),
  renderMarkdown: (node) => {
    const url = (node.attrs?.url as string) ?? ""
    if (!url) return ""
    const title = (node.attrs?.title as string) || fallbackTitle(url)
    return `[${escapeText(title)}](${escapeHref(embedHref(url, node.attrs?.view as EmbedView))})`
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedNodeView)
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<number | null>({
        key: offerKey,
        state: {
          init: () => null,
          apply(tr, value, _old, state) {
            const meta = tr.getMeta(offerKey) as number | null | undefined
            let pos = meta !== undefined ? meta : value
            if (pos == null) return null
            if (meta === undefined) pos = tr.mapping.map(pos)
            // Gone once the caret leaves the line or it's more than the link.
            const node = state.doc.nodeAt(pos)
            if (!onlyLink(node) || !node) return null
            const { from, to } = state.selection
            return from >= pos && to <= pos + node.nodeSize ? pos : null
          },
        },
        props: {
          // A known service's link pasted on an empty line goes in as a
          // link, with the embed versions offered above it.
          handlePaste: (view, event) => {
            if (!view.editable) return false
            const text = event.clipboardData?.getData("text/plain").trim()
            const url = text && !/\s/.test(text) ? normalizeUrl(text) : null
            if (!url || embedInfo(url).provider === "generic") return false
            const { selection, schema } = view.state
            const { $from } = selection
            if (
              !selection.empty ||
              $from.depth !== 1 ||
              $from.parent.type.name !== "paragraph" ||
              $from.parent.content.size !== 0
            )
              return false
            const link = schema.marks.link
            if (!link) return false
            const start = $from.before()
            const tr = view.state.tr.insert(
              $from.pos,
              schema.text(url, [link.create({ href: url })]),
            )
            tr.setStoredMarks([])
            tr.setMeta(offerKey, start)
            view.dispatch(tr.scrollIntoView())
            return true
          },
        },
      }),
    ]
  },
})

/** The "/" item: a field to paste the link into. */
export const EMBED_SLASH_ITEM: BlockItem = {
  id: "embed",
  title: "blockEmbed",
  hint: "blockEmbedHint",
  keywords:
    "embed figma drive google docs sheets slides youtube loom vimeo link tautan bookmark kartu preview video",
  icon: AppWindow,
  run: (e, r) => {
    const chain = e.chain().focus()
    if (r) chain.deleteRange(r)
    chain
      .command(({ tr }) => {
        const embed = e.schema.nodes.embed.create({ url: "" })
        const { $from } = tr.selection
        if ($from.depth === 0) return false
        // It takes the empty line it was asked for on, else goes below it.
        const empty =
          $from.parent.isTextblock && $from.parent.content.size === 0
        const at = empty ? $from.before() : $from.after()
        if (empty) tr.replaceWith(at, $from.after(), embed)
        else tr.insert(at, embed)
        // Picked, so no neighbour stays picked (and shows its menu).
        tr.setSelection(NodeSelection.create(tr.doc, at))
        return true
      })
      .run()
  },
}

type Choice = "link" | "card" | "preview"

/**
 * The versions of the picked embed (or of a just-pasted link): Link, Kartu,
 * Preview, and for a preview its width. Like the picture sizes.
 */
export function EmbedMenu({ editor }: { editor: Editor }) {
  const t = useT("policies")
  const current = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const sel = e.state.selection
      if (sel instanceof NodeSelection && sel.node.type.name === "embed") {
        const url = sel.node.attrs.url as string
        if (!url) return null
        return {
          url,
          view: sel.node.attrs.view as EmbedView,
          canPreview: Boolean(embedInfo(url).src),
        }
      }
      const offer = offerAt(e.state)
      if (!offer) return null
      return {
        url: offer.href,
        view: "link" as const,
        canPreview: Boolean(embedInfo(offer.href).src),
      }
    },
  })

  const toView = (next: EmbedView) => {
    const { state } = editor
    const sel = state.selection
    if (sel instanceof NodeSelection && sel.node.type.name === "embed") {
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setNodeAttribute(sel.from, "view", next)
          tr.setSelection(NodeSelection.create(tr.doc, sel.from))
          return true
        })
        .run()
      return
    }
    const offer = offerAt(state)
    if (!offer) return
    const url = normalizeUrl(offer.href) ?? offer.href
    // A link whose text is the address has no title yet; it's looked up.
    const title = offer.text.trim() === offer.href ? "" : offer.text.trim()
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        const embed = state.schema.nodes.embed.create({
          url,
          title,
          view: next,
        })
        tr.replaceWith(offer.pos, offer.pos + offer.node.nodeSize, embed)
        tr.setSelection(NodeSelection.create(tr.doc, offer.pos))
        tr.setMeta(offerKey, null)
        return true
      })
      .run()
  }

  const toLink = () => {
    const sel = editor.state.selection
    if (!(sel instanceof NodeSelection) || sel.node.type.name !== "embed")
      return
    const url = sel.node.attrs.url as string
    const text = (sel.node.attrs.title as string) || url
    const { schema } = editor.state
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        const para = schema.nodes.paragraph.create(
          null,
          schema.text(text, [schema.marks.link.create({ href: url })]),
        )
        tr.replaceWith(sel.from, sel.to, para)
        tr.setSelection(
          TextSelection.create(tr.doc, sel.from + 1 + text.length),
        )
        // Keep the versions on offer, to switch back.
        tr.setMeta(offerKey, sel.from)
        return true
      })
      .run()
  }

  const choice: Choice | null = !current
    ? null
    : current.view === "link"
      ? "link"
      : current.view === "card"
        ? "card"
        : "preview"
  const pill = (active: boolean, disabled = false) =>
    cn(
      "rounded-full px-3 py-1 text-sm transition-colors",
      active
        ? "bg-muted text-foreground font-medium"
        : "text-muted-foreground hover:text-foreground",
      disabled && "pointer-events-none opacity-40",
    )

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="embedMenu"
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: e }) => {
        if (!e.isEditable) return false
        const sel = e.state.selection
        if (sel instanceof NodeSelection)
          return sel.node.type.name === "embed" && Boolean(sel.node.attrs.url)
        return offerAt(e.state) !== null
      }}
      className="bg-popover text-popover-foreground z-40 flex items-center gap-0.5 rounded-full p-1 shadow-(--elev-4)"
    >
      {(["link", "card", "preview"] as const).map((c) => {
        const disabled = c === "preview" && !current?.canPreview
        return (
          <button
            key={c}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (c === choice) return
              if (c === "link") toLink()
              else if (c === "card") toView("card")
              else toView("preview-wide")
            }}
            aria-pressed={choice === c}
            aria-disabled={disabled}
            title={disabled ? t("embedNoPreview") : undefined}
            className={pill(choice === c, disabled)}
          >
            {t(
              c === "link"
                ? "embedLink"
                : c === "card"
                  ? "embedCard"
                  : "embedPreview",
            )}
          </button>
        )
      })}
      {choice === "preview" && (
        <>
          <span className="bg-border mx-1 h-4 w-px" aria-hidden />
          {(["preview-small", "preview-wide"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toView(v)}
              aria-pressed={current?.view === v}
              className={pill(current?.view === v)}
            >
              {t(v === "preview-small" ? "imageSmall" : "imageWide")}
            </button>
          ))}
        </>
      )}
    </BubbleMenu>
  )
}
