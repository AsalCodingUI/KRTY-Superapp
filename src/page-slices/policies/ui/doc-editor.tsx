"use client"

import { TaskItem, TaskList } from "@tiptap/extension-list"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import Image from "@tiptap/extension-image"
import { Markdown as MarkdownExtension } from "@tiptap/markdown"
import { TableKit } from "@tiptap/extension-table"
import { Placeholder } from "@tiptap/extensions"
import {
  EditorContent,
  mergeAttributes,
  useEditor,
  useEditorState,
  type Editor,
  type Range,
} from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import { ImageIcon, Paperclip } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { BlockHandle } from "./block-handle"
import { DocToolbar } from "./DocToolbar"
import { SelectionMenu } from "./SelectionMenu"
import {
  BLOCK_ITEMS,
  SlashCommand,
  SlashMenu,
  createSlashBridge,
  type BlockItem,
  type SlashBridge,
} from "./slash-command"

/**
 * Reading styles inside the editor; they mirror components/markdown so what
 * is written looks like what is read. Shared by rules and project notes.
 */
export const DOC_PROSE = cn(
  "text-foreground/90 min-h-[40svh] text-[15px] leading-7 outline-none",
  "[&_h1]:text-heading [&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:tracking-tight",
  "[&_h2]:text-heading [&_h2]:mt-7 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold",
  "[&_h3]:text-heading [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold",
  "[&_p]:my-3.5 [&_strong]:text-foreground [&_strong]:font-semibold",
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_li]:pl-1 [&_li_p]:my-0 [&_li::marker]:text-muted-foreground",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-3",
  "[&_blockquote]:border-border [&_blockquote]:my-4 [&_blockquote]:rounded-lg [&_blockquote]:border [&_blockquote]:border-l-[3px] [&_blockquote]:px-4 [&_blockquote]:py-1",
  "[&_hr]:border-border [&_hr]:my-6",
  "[&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
  "[&_pre]:bg-muted [&_pre]:my-4 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-[13px] [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
  "[&_th]:border-border [&_th]:text-muted-foreground [&_th]:border-b [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium",
  "[&_td]:border-border/60 [&_td]:border-b [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td_p]:my-0 [&_th_p]:my-0",
  "[&_.selectedCell]:bg-primary/10",
  // A block picked with its handle: a soft blue tint, no outline.
  "[&_.ProseMirror-selectednode:not(.doc-image)]:bg-primary/[0.08] [&_.ProseMirror-selectednode:not(.doc-image)]:rounded-md [&_.ProseMirror-selectednode]:outline-none [&_.ProseMirror-selectednode:not(.doc-image)]:selection:bg-transparent [&_.ProseMirror-selectednode:not(.doc-image)]:selection:text-foreground",
  // Pictures: centred, at one of three widths (IMAGE_SIZES).
  "[&_.doc-image]:my-4 [&_.doc-image]:w-full [&_img]:mx-auto [&_img]:block [&_img]:h-auto [&_img]:rounded-lg [&_img]:border [&_img]:border-border [&_.ProseMirror-selectednode_img]:ring-2 [&_.ProseMirror-selectednode_img]:ring-primary/40",
  "[&_img[data-size=small]]:w-2/5 [&_img[data-size=medium]]:w-[70%] [&_img[data-size=wide]]:w-full",
  // Placeholder on the empty line with the caret.
  "[&_.is-empty]:before:text-muted-foreground/60 [&_.is-empty]:before:pointer-events-none [&_.is-empty]:before:float-left [&_.is-empty]:before:h-0 [&_.is-empty]:before:content-[attr(data-placeholder)]",
)

/** The compact editor's type: form-sized text, tighter blocks. */
const COMPACT_PROSE =
  "min-h-12 text-[13.5px] leading-relaxed [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_h1]:mt-4 [&_h1]:text-lg [&_h2]:mt-3 [&_h3]:mt-3 [&_.doc-image]:my-2"

/** The editor's blocks and Markdown in/out, with the "/" menu (and, for
 *  notes, images). */
export function docExtensions(
  slash: SlashBridge,
  placeholder: (heading: number | null) => string,
  slashItems: BlockItem[] = BLOCK_ITEMS,
  images = false,
) {
  return [
    ...(images
      ? [SizedImage.configure({ inline: false, allowBase64: false })]
      : []),
    StarterKit.configure({
      // Markdown has no underline; keep the source clean.
      underline: false,
      heading: { levels: [1, 2, 3] },
      link: { openOnClick: false, autolink: true },
      // Where a dragged block will land: a rounded blue bar (doc-dropcursor).
      dropcursor: {
        color: "var(--primary)",
        width: 3,
        class: "doc-dropcursor",
      },
    }),
    TableKit.configure({ table: { resizable: false } }),
    // "- [ ]" checklists.
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({
      showOnlyCurrent: true,
      placeholder: ({ node }) =>
        placeholder(node.type.name === "heading" ? node.attrs.level : null),
    }),
    SlashCommand(slash, slashItems),
    MarkdownExtension,
  ]
}

const isImage = (file: File) => file.type.startsWith("image/")

/** A picture's width in a document; kept in its URL ("…#size=small") so it
 *  survives Markdown, which has no width. Medium is the default. */
export const IMAGE_SIZES = ["small", "medium", "wide"] as const
export type ImageSize = (typeof IMAGE_SIZES)[number]

export function imageSizeOf(src: string | null | undefined): ImageSize {
  const m = /#size=(small|medium|wide)$/.exec(src ?? "")
  return (m?.[1] as ImageSize | undefined) ?? "medium"
}

export function withImageSize(src: string, size: ImageSize) {
  const bare = src.replace(/#size=\w+$/, "")
  return size === "medium" ? bare : `${bare}#size=${size}`
}

/**
 * The image node: a full-width block holding the centred picture (at its
 * data-size width), so dropping above or below a narrow picture has the
 * whole line to aim at, like any other block.
 */
const SizedImage = Image.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { class: "doc-image" },
      [
        "img",
        mergeAttributes(HTMLAttributes, {
          "data-size": imageSizeOf(HTMLAttributes.src as string),
        }),
      ],
    ]
  },
})

/** Small / medium / wide for the selected picture. */
function ImageMenu({ editor }: { editor: Editor }) {
  const t = useT("policies")
  const current = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e.isActive("image")
        ? imageSizeOf(e.getAttributes("image").src as string)
        : null,
  })
  const set = (size: ImageSize) => {
    const src = editor.getAttributes("image").src as string | undefined
    if (!src) return
    editor
      .chain()
      .focus()
      .updateAttributes("image", { src: withImageSize(src, size) })
      .run()
  }
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="imageMenu"
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: e }) => e.isEditable && e.isActive("image")}
      className="bg-popover text-popover-foreground z-40 flex items-center gap-0.5 rounded-full p-1 shadow-(--elev-4)"
    >
      {IMAGE_SIZES.map((size) => (
        <button
          key={size}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => set(size)}
          aria-pressed={current === size}
          className={cn(
            "rounded-full px-3 py-1 text-sm transition-colors",
            current === size
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(
            size === "small"
              ? "imageSmall"
              : size === "medium"
                ? "imageMedium"
                : "imageWide",
          )}
        </button>
      ))}
    </BubbleMenu>
  )
}

/**
 * A Markdown document editor (the rules editor without the rule around it):
 * toolbar, "/" blocks, the selection menu. `value` is read once; edits come
 * back as Markdown through `onChange`.
 */
export function MarkdownDocEditor({
  value,
  onChange,
  ariaLabel,
  className,
  onReady,
  onUploadImage,
  onUploadFile,
  compact = false,
  placeholder,
  onBlur,
  readOnly = false,
}: {
  value: string
  onChange: (markdown: string) => void
  ariaLabel: string
  className?: string
  onReady?: (editor: Editor) => void
  /** Inline in a form (a task's description): no toolbar, grows with its
   *  text, smaller type; the "/" menu, handles and selection menu stay. */
  compact?: boolean
  /** Shown on an empty line (compact; documents use the rules' hint). */
  placeholder?: string
  /** Leaving the editor, e.g. to save. */
  onBlur?: () => void
  /** Shown only: the same typeset document, without the toolbar, handles
   *  or menus (a client reading a report). */
  readOnly?: boolean
  /** Turns images on: uploads one (compressed unless `original`) and
   *  returns its public URL. Pictures go in from "/", paste or drop. */
  onUploadImage?: (file: File, original: boolean) => Promise<string>
  /** Turns attachments on: any other file dropped, pasted or picked from
   *  "/" uploads and goes in as a link with its name. */
  onUploadFile?: (file: File) => Promise<string>
}) {
  const t = useT("policies")
  const tRef = useRef(t)
  tRef.current = t
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onBlurRef = useRef(onBlur)
  onBlurRef.current = onBlur
  const placeholderRef = useRef(placeholder)
  placeholderRef.current = placeholder
  const uploadRef = useRef(onUploadImage)
  uploadRef.current = onUploadImage
  const uploadFileRef = useRef(onUploadFile)
  uploadFileRef.current = onUploadFile
  const attachInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  // The next pick from "/" keeps its original resolution.
  const pickOriginal = useRef(false)
  const editorRef = useRef<Editor | null>(null)
  const [slash] = useState(createSlashBridge)

  /**
   * Where the next upload goes: a drop point (kept inside the document, as
   * it may have changed during the upload), else the caret. After each
   * insert it moves past what went in, so several files land in order.
   */
  type Cursor = { pos?: number }
  const insertAt = (
    cursor: Cursor,
    content: Parameters<Editor["commands"]["insertContent"]>[0],
  ) => {
    const editor = editorRef.current
    if (!editor) return
    const chain = editor.chain().focus()
    if (cursor.pos === undefined) chain.insertContent(content).run()
    else
      chain
        .insertContentAt(
          Math.min(cursor.pos, editor.state.doc.content.size),
          content,
        )
        .run()
    cursor.pos = editor.state.selection.to
  }

  /** Uploads the pictures and puts them in at the cursor, in order. */
  const insertImages = async (
    files: File[],
    cursor: Cursor = {},
    original = false,
  ) => {
    const upload = uploadRef.current
    if (!upload || !editorRef.current) return
    for (const file of files.filter(isImage)) {
      const id = toast.loading(tRef.current("imageUploading"))
      try {
        const src = await upload(file, original)
        insertAt(cursor, { type: "image", attrs: { src, alt: file.name } })
        toast.dismiss(id)
      } catch {
        toast.error(tRef.current("imageUploadFailed"), { id })
      }
    }
  }

  /** Uploads other files and links them, by name, at the cursor. */
  const insertFiles = async (files: File[], cursor: Cursor = {}) => {
    const upload = uploadFileRef.current
    if (!upload || !editorRef.current) return
    for (const file of files) {
      const id = toast.loading(tRef.current("fileUploading"))
      try {
        const href = await upload(file)
        const content = [
          {
            type: "text",
            text: file.name,
            marks: [{ type: "link", attrs: { href } }],
          },
          { type: "text", text: " " },
        ]
        insertAt(cursor, content)
        toast.dismiss(id)
      } catch {
        toast.error(tRef.current("fileUploadFailed"), { id })
      }
    }
  }

  /** Pictures as images, anything else as attachments (when turned on). */
  const insertDropped = (files: File[], pos?: number) => {
    const images = uploadRef.current ? files.filter(isImage) : []
    const others = uploadFileRef.current
      ? files.filter((f) => !images.includes(f))
      : []
    // One after the other, from the same point.
    const cursor: Cursor = { pos }
    void (async () => {
      if (images.length) await insertImages(images, cursor)
      if (others.length) await insertFiles(others, cursor)
    })()
    return images.length + others.length > 0
  }

  // The rule blocks, plus pictures and attachments where they're on.
  const [slashItems] = useState<BlockItem[]>(() => {
    const items: BlockItem[] = [...BLOCK_ITEMS]
    const pickImage = (original: boolean) => (e: Editor, r?: Range) => {
      if (r) e.chain().focus().deleteRange(r).run()
      pickOriginal.current = original
      fileInput.current?.click()
    }
    if (onUploadImage)
      items.push(
        {
          id: "image",
          title: "blockImage",
          hint: "blockImageHint",
          keywords: "image gambar foto picture screenshot img",
          icon: ImageIcon,
          run: pickImage(false),
        },
        {
          id: "image-original",
          title: "blockImageOriginal",
          hint: "blockImageOriginalHint",
          keywords: "image gambar original asli hd full resolusi",
          icon: ImageIcon,
          run: pickImage(true),
        },
      )
    if (onUploadFile)
      items.push({
        id: "file",
        title: "blockFile",
        hint: "blockFileHint",
        keywords: "file lampiran attachment pdf video dokumen upload",
        icon: Paperclip,
        run: (e, r) => {
          if (r) e.chain().focus().deleteRange(r).run()
          attachInput.current?.click()
        },
      })
    return items
  })

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: docExtensions(
      slash,
      (level) =>
        level
          ? tRef.current("headingPlaceholder", { level })
          : (placeholderRef.current ?? tRef.current("bodyPlaceholder")),
      slashItems,
      Boolean(onUploadImage) || readOnly,
    ),
    content: value,
    contentType: "markdown",
    onCreate: ({ editor: e }) => {
      editorRef.current = e
      onReady?.(e)
    },
    onUpdate: ({ editor: e }) => onChangeRef.current(e.getMarkdown()),
    onBlur: () => onBlurRef.current?.(),
    editorProps: {
      attributes: {
        class: compact ? cn(DOC_PROSE, COMPACT_PROSE) : DOC_PROSE,
        "aria-label": ariaLabel,
      },
      // Pasted or dropped pictures upload and go in where they land.
      handlePaste: (_view, event) => {
        const data = event.clipboardData
        // Word / Excel put a picture of the selection next to its text:
        // paste the text, not the picture.
        if (data?.getData("text/html") || data?.getData("text/plain").trim())
          return false
        const files = [...(data?.files ?? [])]
        return files.length > 0 && insertDropped(files)
      },
      handleDrop: (view, event) => {
        const files = [...(event.dataTransfer?.files ?? [])]
        if (files.length === 0) return false
        const pos = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos
        if (!insertDropped(files, pos)) return false
        event.preventDefault()
        return true
      },
    },
  })

  const menus = (
    <>
      {editor && <SelectionMenu editor={editor} />}
      {editor && onUploadImage && <ImageMenu editor={editor} />}
      <SlashMenu bridge={slash} />
      {onUploadFile && (
        <input
          ref={attachInput}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            void insertFiles([...(e.target.files ?? [])])
            e.target.value = ""
          }}
        />
      )}
      {onUploadImage && (
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const original = pickOriginal.current
            pickOriginal.current = false
            void insertImages([...(e.target.files ?? [])], undefined, original)
            e.target.value = ""
          }}
        />
      )}
    </>
  )

  if (readOnly) {
    return (
      <div className={cn("min-h-0 overflow-y-auto", className)}>
        <div className="mx-auto w-full max-w-3xl px-6 pt-8 pb-24 sm:px-16">
          <EditorContent editor={editor} />
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      // The hover area reaches into the gutter on the left, where the drag
      // handle sits, so moving the pointer to it doesn't lose it.
      <div className={cn("relative md:-ml-9 md:pl-9", className)}>
        <EditorContent editor={editor} />
        {editor && <BlockHandle editor={editor} compact />}
        {menus}
      </div>
    )
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="border-border flex h-12 shrink-0 items-center overflow-x-auto border-b px-3">
        {editor && <DocToolbar editor={editor} />}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative mx-auto w-full max-w-3xl px-6 pt-8 pb-24 sm:px-16">
          <EditorContent editor={editor} />
          {editor && <BlockHandle editor={editor} />}
        </div>
      </div>
      {menus}
    </div>
  )
}
