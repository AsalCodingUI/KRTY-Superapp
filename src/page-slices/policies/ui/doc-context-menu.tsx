"use client"

import { useLightbox } from "@/components/image-lightbox"
import {
  copyText,
  download,
  useContextTarget,
  type CtxContext,
  type CtxItem,
  type CtxSection,
} from "@/shared/context-menu"
import { useT } from "@/shared/i18n/client"
import { embedInfo, type EmbedView } from "@/shared/lib/embeds"
import type { Node as PMNode } from "@tiptap/pm/model"
import { NodeSelection, TextSelection } from "@tiptap/pm/state"
import type { Editor } from "@tiptap/react"
import {
  AppWindow,
  ArrowDown,
  ArrowUp,
  Briefcase,
  Copy,
  CopyPlus,
  Download,
  ExternalLink,
  FileText,
  ImageUp,
  Languages,
  Link as LinkIcon,
  Maximize2,
  Minimize2,
  Repeat2,
  Ruler,
  Smile,
  Sparkles,
  Trash2,
  WandSparkles,
} from "@/components/icons"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { startAi } from "./ai-assist"
import { blockAt } from "./block-handle"
import { CALLOUT_SLASH_ITEM } from "./callout"
import {
  IMAGE_SIZES,
  imageSizeOf,
  withImageSize,
  type ImageSize,
} from "./doc-editor"
import { embedToLink, setEmbedView } from "./embed"
import { taskHref } from "./mention"
import { BLOCK_ITEMS } from "./slash-command"
import { TOGGLE_SLASH_ITEM } from "./toggle"

/*
 * Right-click in a document (shared/context-menu): what is under the
 * pointer, most specific first —
 *   a mention (open the task / copy the name), a picture (size, Buka
 *   besar, Ganti, Hapus), an embed (Link / Kartu / Preview, Buka), and
 *   the block (Ubah jadi, Duplikat, Pindah ke atas / bawah, Salin sebagai
 *   Markdown, AI, Hapus). Read-only documents keep the reading actions.
 * AI is offered only here (and the editor's own menus), never by the
 * app-wide menu: it costs quota.
 */

/** Which "Ubah jadi" targets, in order (ids from BLOCK_ITEMS). */
const TURN_INTO = [
  "text",
  "h1",
  "h2",
  "h3",
  "bullet",
  "ordered",
  "checklist",
  "quote",
]

/** The position of the `type` node a node view's DOM belongs to. */
function nodePosOf(editor: Editor, el: Element, type: string) {
  const { view, state } = editor
  let p: number
  try {
    p = view.posAtDOM(el, 0)
  } catch {
    return null
  }
  for (const cand of [p, p - 1]) {
    if (cand < 0 || cand > state.doc.content.size) continue
    if (state.doc.nodeAt(cand)?.type.name === type) return cand
  }
  const $p = state.doc.resolve(Math.min(p, state.doc.content.size))
  for (let d = $p.depth; d > 0; d--)
    if ($p.node(d).type.name === type) return $p.before(d)
  return null
}

/** Which "Ubah jadi" item a block is now. */
function currentKind(editor: Editor, pos: number, node: PMNode) {
  const name = node.type.name
  if (name === "paragraph") return "text"
  if (name === "heading") return `h${node.attrs.level as number}`
  if (name === "blockquote") return "quote"
  if (name === "callout" || name === "toggle") return name
  if (name === "listItem" || name === "taskItem") {
    const list = editor.state.doc.resolve(pos).parent.type.name
    return list === "orderedList"
      ? "ordered"
      : list === "taskList"
        ? "checklist"
        : "bullet"
  }
  return null
}

function selectInside(editor: Editor, pos: number, node: PMNode) {
  const { state, view } = editor
  // Into the first text of the block (a list item's paragraph).
  const end = pos + node.nodeSize
  const sel = TextSelection.between(
    state.doc.resolve(Math.min(pos + 1, end)),
    state.doc.resolve(Math.max(pos + 1, end - 1)),
  )
  view.dispatch(state.tr.setSelection(sel))
}

export function DocContextMenu({
  editor,
  onReplaceImage,
  ai = false,
}: {
  editor: Editor
  /** Opens a picker whose picture replaces the one at `pos`. */
  onReplaceImage?: (pos: number) => void
  /** The editor shows AI answers (AiPreview mounted): offer AI actions. */
  ai?: boolean
}) {
  const t = useT("ctxmenu")
  const tp = useT("policies")
  const ta = useT("ai")
  const router = useRouter()
  const lightbox = useLightbox()
  const [dom, setDom] = useState<Element | null>(null)
  useEffect(() => {
    if (!editor.isDestroyed) setDom(editor.view.dom)
  }, [editor])

  const build = (ctx: CtxContext): CtxSection[] => {
    if (editor.isDestroyed) return []
    const { state } = editor
    const editable = editor.isEditable
    const target = ctx.target
    const sections: CtxSection[] = []

    const run = (fn: (tr: typeof state.tr) => void) => {
      const tr = editor.state.tr
      fn(tr)
      editor.view.dispatch(tr.scrollIntoView())
      editor.view.focus()
    }

    /** Duplikat / Pindah / Hapus for the node at `pos`. */
    const blockOps = (pos: number, node: PMNode): CtxItem[] => {
      if (!editable) return []
      const $pos = state.doc.resolve(pos)
      const index = $pos.index()
      const parent = $pos.parent
      return [
        {
          id: "duplicate",
          label: t("duplicate"),
          icon: CopyPlus,
          onSelect: () =>
            run((tr) =>
              tr.insert(pos + node.nodeSize, node.copy(node.content)),
            ),
        },
        {
          id: "move-up",
          label: t("moveUp"),
          icon: ArrowUp,
          disabled: index === 0,
          onSelect: () =>
            run((tr) => {
              const prev = parent.child(index - 1)
              tr.delete(pos, pos + node.nodeSize).insert(
                pos - prev.nodeSize,
                node,
              )
            }),
        },
        {
          id: "move-down",
          label: t("moveDown"),
          icon: ArrowDown,
          disabled: index >= parent.childCount - 1,
          onSelect: () =>
            run((tr) => {
              const next = parent.child(index + 1)
              tr.delete(pos, pos + node.nodeSize).insert(
                pos + next.nodeSize,
                node,
              )
            }),
        },
        {
          id: "delete",
          label: t("delete"),
          icon: Trash2,
          destructive: true,
          // One ⌘Z brings it back.
          onSelect: () => run((tr) => tr.delete(pos, pos + node.nodeSize)),
        },
      ]
    }

    const aiItems = (prepare: () => void): CtxItem[] =>
      (
        [
          ["en", "English"],
          ["id", "Indonesia"],
        ] as const
      )
        .map(
          ([language, name]): CtxItem => ({
            id: `ai-${language}`,
            label: ta("translateTo", { language: name }),
            icon: Languages,
            onSelect: () => {
              prepare()
              startAi(editor, "selection", { action: "translate", language })
            },
          }),
        )
        .concat(
          (
            [
              ["clearer", WandSparkles],
              ["shorter", Minimize2],
              ["longer", Maximize2],
              ["casual", Smile],
              ["formal", Briefcase],
            ] as const
          ).map(([action, icon]) => ({
            id: `ai-${action}`,
            label: ta(action),
            icon,
            onSelect: () => {
              prepare()
              startAi(editor, "selection", { action })
            },
          })),
        )

    // Selected text: AI on it (the editor's preview shows the answer).
    if (ai && editable && !state.selection.empty && ctx.selectionText.trim()) {
      const keep = state.selection
      sections.push({
        label: t("groupSelection"),
        items: [
          {
            id: "ai-selection",
            label: ta("aiTitle"),
            icon: Sparkles,
            submenu: aiItems(() => {
              editor.view.dispatch(
                editor.state.tr.setSelection(
                  keep.map(editor.state.doc, editor.state.tr.mapping),
                ),
              )
            }),
          },
        ],
      })
    }

    // A mention pill.
    const pill = target.closest(".mention-pill")
    if (pill) {
      const pos = nodePosOf(editor, pill, "mention")
      const node = pos === null ? null : state.doc.nodeAt(pos)
      const a = node?.attrs as
        | {
            kind: string
            id: string | null
            projectId: string | null
            label: string
          }
        | undefined
      // Signed out (client pages) a task is only its name: no team link.
      if (a?.kind === "task" && a.id && a.projectId && ctx.access) {
        const href = taskHref(a.projectId, a.id, a.label)
        sections.push({
          label: `${t("docTask")} · ${a.label}`,
          items: [
            {
              id: "open-task",
              label: t("openTask"),
              icon: FileText,
              // Editing: a new tab keeps the unsaved document.
              onSelect: () =>
                editable ? void window.open(href, "_blank") : router.push(href),
            },
            {
              id: "copy-task-link",
              label: t("copyLink"),
              icon: LinkIcon,
              onSelect: async () => {
                if (await copyText(new URL(href, location.origin).href))
                  toast.success(t("linkCopied"))
              },
            },
          ],
        })
      } else if (a) {
        sections.push({
          label: `${t(a.kind === "task" ? "docTask" : "docPerson")} · ${a.label}`,
          items: [
            {
              id: "copy-name",
              label: t("copyName"),
              icon: Copy,
              onSelect: async () => {
                if (await copyText(a.label)) toast.success(t("copied"))
              },
            },
          ],
        })
      }
    }

    // A picture.
    const picture = target.closest(".doc-image")
    const imagePos = picture ? nodePosOf(editor, picture, "image") : null
    const imageNode = imagePos === null ? null : state.doc.nodeAt(imagePos)
    if (imagePos !== null && imageNode) {
      const src = imageNode.attrs.src as string
      const size = imageSizeOf(src)
      const img = picture?.querySelector("img")
      const bare = src.replace(/#size=\w+$/, "")
      const sizeKey = (s: ImageSize) =>
        s === "small"
          ? "imageSmall"
          : s === "medium"
            ? "imageMedium"
            : "imageWide"
      sections.push({
        label: t("docImage"),
        items: [
          {
            id: "size",
            label: t("imageSize"),
            icon: Ruler,
            hint: tp(sizeKey(size)),
            hidden: !editable,
            submenu: IMAGE_SIZES.map((s) => ({
              id: s,
              label: tp(sizeKey(s)),
              role: "radio" as const,
              checked: s === size,
              onSelect: () =>
                run((tr) =>
                  tr.setNodeMarkup(imagePos, undefined, {
                    ...imageNode.attrs,
                    src: withImageSize(src, s),
                  }),
                ),
            })),
          },
          {
            id: "view-large",
            label: t("viewLarge"),
            icon: Maximize2,
            hidden: !img,
            onSelect: () => {
              if (!img) return
              if (lightbox) lightbox.open(img)
              else window.open(bare, "_blank", "noopener")
            },
          },
          {
            id: "replace",
            label: t("replaceImage"),
            icon: ImageUp,
            hidden: !editable || !onReplaceImage,
            onSelect: () => onReplaceImage?.(imagePos),
          },
          {
            id: "copy-image-link",
            label: t("copyImageLink"),
            icon: LinkIcon,
            onSelect: async () => {
              if (await copyText(new URL(bare, location.origin).href))
                toast.success(t("linkCopied"))
            },
          },
          {
            id: "download",
            label: t("download"),
            icon: Download,
            onSelect: () =>
              download(bare, (imageNode.attrs.alt as string) || "image"),
          },
          ...blockOps(imagePos, imageNode),
        ],
      })
      return sections
    }

    // An embed.
    const embedEl = target.closest(".doc-embed, [data-embed]")
    const embedPos = embedEl ? nodePosOf(editor, embedEl, "embed") : null
    const embedNode = embedPos === null ? null : state.doc.nodeAt(embedPos)
    if (embedPos !== null && embedNode?.attrs.url) {
      const url = embedNode.attrs.url as string
      const view = embedNode.attrs.view as EmbedView
      const pick = () =>
        editor.view.dispatch(
          editor.state.tr.setSelection(
            NodeSelection.create(editor.state.doc, embedPos),
          ),
        )
      const canPreview = Boolean(embedInfo(url).src)
      sections.push({
        label: `${t("docEmbed")} · ${(embedNode.attrs.title as string) || url}`,
        items: [
          {
            id: "open",
            label: t("open"),
            icon: ExternalLink,
            onSelect: () => void window.open(url, "_blank", "noopener"),
          },
          {
            id: "copy-link",
            label: t("copyLink"),
            icon: LinkIcon,
            onSelect: async () => {
              if (await copyText(url)) toast.success(t("linkCopied"))
            },
          },
          {
            id: "version",
            label: t("embedVersion"),
            icon: AppWindow,
            hidden: !editable,
            hint: tp(view === "card" ? "embedCard" : "embedPreview"),
            submenu: [
              {
                id: "link",
                label: tp("embedLink"),
                role: "radio",
                checked: false,
                onSelect: () => {
                  pick()
                  embedToLink(editor)
                },
              },
              {
                id: "card",
                label: tp("embedCard"),
                role: "radio",
                checked: view === "card",
                onSelect: () => {
                  pick()
                  setEmbedView(editor, "card")
                },
              },
              {
                id: "preview-small",
                label: `${tp("embedPreview")} · ${tp("imageSmall")}`,
                role: "radio",
                checked: view === "preview-small",
                hidden: !canPreview,
                onSelect: () => {
                  pick()
                  setEmbedView(editor, "preview-small")
                },
              },
              {
                id: "preview-wide",
                label: `${tp("embedPreview")} · ${tp("imageWide")}`,
                role: "radio",
                checked: view === "preview-wide",
                hidden: !canPreview,
                onSelect: () => {
                  pick()
                  setEmbedView(editor, "preview-wide")
                },
              },
            ],
          },
          ...blockOps(embedPos, embedNode),
        ],
      })
      return sections
    }

    // The block under the pointer (or the caret, from the keyboard).
    const pos = ctx.keyboard
      ? (() => {
          const $f = state.selection.$from
          return $f.depth ? $f.before(1) : null
        })()
      : blockAt(editor, ctx.x, ctx.y)
    const node = pos === null ? null : state.doc.nodeAt(pos)
    if (pos === null || !node) return sections
    const kind = currentKind(editor, pos, node)
    const markdown = () => {
      const json = node.toJSON()
      const parent = state.doc.resolve(pos).parent
      const content =
        node.type.name === "listItem" || node.type.name === "taskItem"
          ? [{ type: parent.type.name, attrs: parent.attrs, content: [json] }]
          : [json]
      return (
        editor.markdown?.serialize({ type: "doc", content }) ?? node.textContent
      )
    }
    const turnInto = [
      ...BLOCK_ITEMS.filter((b) => TURN_INTO.includes(b.id)),
      ...(state.schema.nodes.callout ? [CALLOUT_SLASH_ITEM] : []),
      ...(state.schema.nodes.toggle ? [TOGGLE_SLASH_ITEM] : []),
    ]
    const textual = node.isTextblock || kind !== null
    sections.push({
      label: t("docBlock"),
      items: [
        {
          id: "turn-into",
          label: t("turnInto"),
          icon: Repeat2,
          hidden: !editable || !textual,
          submenu: turnInto.map((b) => ({
            id: b.id,
            label: tp(b.title),
            icon: b.icon,
            role: "radio" as const,
            checked: kind === b.id,
            onSelect: () => {
              if (kind === b.id) return
              selectInside(editor, pos, node)
              const inList =
                node.type.name === "listItem" || node.type.name === "taskItem"
              if (inList && b.id === "text")
                editor.chain().focus().liftListItem(node.type.name).run()
              else b.run(editor)
            },
          })),
        },
        {
          id: "copy-markdown",
          label: t("copyMarkdown"),
          icon: Copy,
          onSelect: async () => {
            if (await copyText(markdown())) toast.success(t("copied"))
            else toast.error(t("copyFailed"))
          },
        },
        {
          id: "ai-block",
          label: t("aiBlock"),
          icon: Sparkles,
          hidden: !ai || !editable || !node.textContent.trim(),
          submenu: aiItems(() => selectInside(editor, pos, node)),
        },
        ...blockOps(pos, node),
      ],
    })
    return sections
  }

  useContextTarget(dom, build, { type: "doc", suppress: ["image"] })
  return null
}
