"use client"

import { GalleryStrip, type GalleryImage } from "@/components/gallery-strip"
import { parseGallerySrc, withGallery } from "@/shared/lib/doc-blocks"
import {
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type Editor,
  type NodeViewProps,
} from "@tiptap/react"
import { useT } from "@/shared/i18n/client"
import { GalleryHorizontal } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import type { BlockItem } from "./slash-command"

/*
 * Gallery: several pictures in one row that scrolls sideways. In Markdown
 * a paragraph of pictures only, one per line, each URL ending "#gallery"
 * (see shared/lib/doc-blocks):
 *
 *   ![a.jpg](https://…/report-images/a.webp#gallery&w=1352&h=608)
 *   ![b.jpg](https://…/report-images/b.webp#gallery)
 *
 * The node keeps the bare URLs and each picture's size ({ w, h }, measured
 * at upload or on first load); the marker is added when written out.
 * Pictures upload the way single images do (useDocUploads), which hands the
 * editor a picker through `editor.storage.gallery.pick`.
 */

/** Opens the file picker, uploads, and calls back with the pictures. */
export type GalleryPicker = (done: (images: GalleryImage[]) => void) => void

/** The picker handed to an editor (null until useDocUploads sets it). */
export const galleryStorage = (editor: Editor) =>
  (editor.storage as unknown as Record<string, unknown>).gallery as
    | { pick: GalleryPicker | null }
    | undefined

const IMG =
  /!\[((?:\\.|[^\\\]\n])*)\]\(<?([^\s<>()]+?#gallery(?:&w=\d+&h=\d+)?)>?(?:[ \t]+"[^"\n]*")?\)/
const IMG_G = new RegExp(IMG.source, "g")
/** One or more lines holding only gallery pictures. */
const LINES = new RegExp(`^(?: {0,3}(?:${IMG.source}[ \\t]*)+(?:\\n|$))+`)
const LINE_START = new RegExp(`(?:^|\\n) {0,3}${IMG.source}`)

const escapeAlt = (s: string) => s.replace(/([\\[\]])/g, "\\$1")
const unescapeAlt = (s: string) => s.replace(/\\(.)/g, "$1")
// Parentheses and spaces would end the URL early.
const escapeHref = (s: string) =>
  s.replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/ /g, "%20")

const imagesOf = (v: unknown): GalleryImage[] =>
  Array.isArray(v)
    ? v.filter(
        (i): i is GalleryImage =>
          Boolean(i) && typeof (i as GalleryImage).src === "string",
      )
    : []

function GalleryView({ node, editor, getPos, deleteNode }: NodeViewProps) {
  const images = imagesOf(node.attrs.images)
  const editing = editor.isEditable

  const set = (next: GalleryImage[]) => {
    const pos = getPos()
    if (typeof pos !== "number") return
    if (next.length === 0) return deleteNode()
    editor.view.dispatch(editor.state.tr.setNodeAttribute(pos, "images", next))
  }

  // A picture from before sizes were kept: remember its size once loaded
  // (not an edit of its own: no undo step).
  const remember = (i: number, w: number, h: number) => {
    const pos = getPos()
    if (!editing || typeof pos !== "number" || !images[i]) return
    const next = images.map((img, j) => (j === i ? { ...img, w, h } : img))
    editor.view.dispatch(
      editor.state.tr
        .setNodeAttribute(pos, "images", next)
        .setMeta("addToHistory", false),
    )
  }

  return (
    <NodeViewWrapper className="doc-gallery">
      <GalleryStrip
        images={images}
        editing={editing}
        onAdd={
          editing && galleryStorage(editor)?.pick
            ? () =>
                galleryStorage(editor)?.pick?.((added) => {
                  // The node may have moved (or changed) during the upload.
                  const pos = getPos()
                  const now =
                    typeof pos === "number"
                      ? editor.state.doc.nodeAt(pos)
                      : null
                  const current =
                    now?.type.name === "gallery"
                      ? imagesOf(now.attrs.images)
                      : images
                  set([...current, ...added])
                })
            : undefined
        }
        onRemove={(i) => set(images.filter((_, j) => j !== i))}
        onMeasure={remember}
        onMove={(from, to) => {
          const next = [...images]
          const [moved] = next.splice(from, 1)
          next.splice(to, 0, moved)
          set(next)
        }}
      />
    </NodeViewWrapper>
  )
}

export const Gallery = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addStorage() {
    return { pick: null as GalleryPicker | null }
  },

  addAttributes() {
    return { images: { default: [] as GalleryImage[], rendered: false } }
  },

  parseHTML() {
    return [
      {
        tag: "div[data-gallery]",
        getAttrs: (el) => ({
          images: [...(el as HTMLElement).querySelectorAll("img")].map(
            (img) => {
              const src = img.getAttribute("src") ?? ""
              return {
                ...(parseGallerySrc(src) ?? { src }),
                alt: img.getAttribute("alt") ?? "",
              }
            },
          ),
        }),
      },
    ]
  },

  renderHTML({ node }) {
    return [
      "div",
      { "data-gallery": "" },
      ...imagesOf(node.attrs.images).map(
        (i) =>
          ["img", { src: withGallery(i.src, i.w, i.h), alt: i.alt }] as const,
      ),
    ]
  },

  markdownTokenName: "gallery",
  markdownTokenizer: {
    name: "gallery",
    level: "block",
    start: (src: string) => {
      const m = LINE_START.exec(src)
      return m ? m.index + (m[0].startsWith("\n") ? 1 : 0) : -1
    },
    tokenize: (src: string) => {
      const m = LINES.exec(src)
      if (!m) return undefined
      const images = [...m[0].matchAll(IMG_G)].map((i) => ({
        ...(parseGallerySrc(i[2]) ?? { src: i[2] }),
        alt: unescapeAlt(i[1]),
      }))
      return { type: "gallery", raw: m[0], images }
    },
  },
  parseMarkdown: (token, helpers) =>
    helpers.createNode("gallery", { images: token.images as GalleryImage[] }),
  renderMarkdown: (node) =>
    imagesOf(node.attrs?.images)
      .map(
        (i) =>
          `![${escapeAlt(i.alt)}](${escapeHref(withGallery(i.src, i.w, i.h))})`,
      )
      .join("\n"),

  addNodeView() {
    const editor = this.editor
    return ReactNodeViewRenderer(GalleryView, {
      // The row's buttons, and its reordering drags, stay with it; while
      // editing, a click on a picture goes to the editor (it picks the
      // block); reading, it opens the picture.
      stopEvent: ({ event }) => {
        const target = event.target as Element | null
        if (target?.closest?.("[data-gallery-control]")) return true
        if (!target?.closest?.("[data-gallery-tile]")) return false
        return !editor.isEditable || /^(drag|drop)/.test(event.type)
      },
    })
  },
})

/** The "/" item: pick pictures, then they go in as one gallery. */
export function gallerySlashItem(pick: GalleryPicker): BlockItem {
  return {
    id: "gallery",
    title: "blockGallery",
    hint: "blockGalleryHint",
    keywords: "galeri gallery carousel slider foto gambar banyak images album",
    icon: GalleryHorizontal,
    run: (e: Editor, r) => {
      if (r) e.chain().focus().deleteRange(r).run()
      pick((images) => {
        if (images.length === 0) return
        e.chain()
          .focus()
          .insertContent({ type: "gallery", attrs: { images } })
          .run()
      })
    },
  }
}

type Upload = (file: File, original: boolean) => Promise<string>

/**
 * The gallery's file picker: a hidden input (render `input`) and `pick`,
 * which opens it, uploads the chosen pictures through `getUpload()` (the
 * same upload single images use) and calls back with them, in order.
 */
export function useGalleryPicker(getUpload: () => Upload | undefined) {
  const t = useT("policies")
  const tRef = useRef(t)
  tRef.current = t
  const getUploadRef = useRef(getUpload)
  getUploadRef.current = getUpload
  const inputRef = useRef<HTMLInputElement>(null)
  const pending = useRef<((images: GalleryImage[]) => void) | null>(null)
  const [pick] = useState(() => {
    const open: GalleryPicker = (done) => {
      pending.current = done
      inputRef.current?.click()
    }
    return open
  })

  const upload = async (files: File[]) => {
    const done = pending.current
    pending.current = null
    const up = getUploadRef.current()
    const pictures = files.filter((f) => f.type.startsWith("image/"))
    if (!done || !up || pictures.length === 0) return
    const id = toast.loading(
      tRef.current("galleryUploading", { n: pictures.length }),
    )
    const images: GalleryImage[] = []
    let failed = false
    for (const file of pictures) {
      try {
        // Its size, so readers keep its space before it loads.
        const size = await createImageBitmap(file)
          .then((b) => {
            const out = { w: b.width, h: b.height }
            b.close()
            return out
          })
          .catch(() => ({}))
        images.push({ src: await up(file, false), alt: file.name, ...size })
      } catch {
        failed = true
      }
    }
    if (failed) toast.error(tRef.current("imageUploadFailed"), { id })
    else toast.dismiss(id)
    if (images.length) done(images)
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      multiple
      hidden
      onChange={(e) => {
        void upload([...(e.target.files ?? [])])
        e.target.value = ""
      }}
    />
  )
  return { pick, input }
}
