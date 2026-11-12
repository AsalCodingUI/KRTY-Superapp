"use client"

import { HoverHighlight } from "@/components/sliding-indicator"
import { cn } from "@/lib/utils"
import { CalloutBox } from "@/components/callout-box"
import { EmbedBlock } from "@/components/embed-block"
import { GalleryStrip, type GalleryImage } from "@/components/gallery-strip"
import { LightboxScope, ZoomOnClickImage } from "@/components/image-lightbox"
import {
  isCalloutTone,
  isGallerySrc,
  remarkDocBlocks,
  parseGallerySrc,
} from "@/shared/lib/doc-blocks"
import { parseEmbedHref } from "@/shared/lib/embeds"
import { MENTION_SCHEME } from "@/shared/lib/mentions"
import ReactMarkdown, {
  defaultUrlTransform,
  type Components,
  type ExtraProps,
} from "react-markdown"
import { ChevronRight } from "@/components/icons"
import { Children, useRef } from "react"

type Element = NonNullable<ExtraProps["node"]>
type ElementContent = Element["children"][number]
import remarkGfm from "remark-gfm"

/**
 * Reading styles for rule documents. Raw HTML in the source is not rendered
 * (react-markdown escapes it), so content written by admins stays plain text.
 */
const components: Components = {
  h1: ({ node: _, ...p }) => (
    <h2
      className="text-heading mt-8 mb-3 text-xl font-medium tracking-tight first:mt-0"
      {...p}
    />
  ),
  h2: ({ node: _, ...p }) => (
    <h3
      className="text-heading mt-7 mb-2 text-base font-medium first:mt-0"
      {...p}
    />
  ),
  h3: ({ node: _, ...p }) => (
    <h4
      className="text-heading mt-6 mb-2 text-sm font-medium first:mt-0"
      {...p}
    />
  ),
  h4: ({ node: _, ...p }) => (
    <h5
      className="text-foreground mt-5 mb-1.5 text-sm font-medium first:mt-0"
      {...p}
    />
  ),
  p: ({ node: _, ...p }) => <p className="my-3 first:mt-0 last:mb-0" {...p} />,
  ul: ({ node: _, ...p }) => (
    <ul
      className="marker:text-muted-foreground my-3 flex list-disc flex-col gap-1.5 pl-5"
      {...p}
    />
  ),
  ol: ({ node: _, ...p }) => (
    <ol
      className="marker:text-muted-foreground my-3 flex list-decimal flex-col gap-1.5 pl-5"
      {...p}
    />
  ),
  li: ({ node: _, ...p }) => (
    <li className="pl-1 [&>ol]:my-1.5 [&>ul]:my-1.5" {...p} />
  ),
  a: ({ node: _, ...p }) =>
    // An @mention (shared/lib/mentions): a plain pill, never a link here.
    typeof p.href === "string" && p.href.startsWith(MENTION_SCHEME) ? (
      <span className="bg-muted text-foreground rounded-md px-1.5 py-px text-[0.92em] font-medium [overflow-wrap:anywhere]">
        {p.children}
      </span>
    ) : (
      <a
        className="text-primary underline underline-offset-3 hover:no-underline"
        target="_blank"
        rel="noreferrer noopener"
        {...p}
      />
    ),
  strong: ({ node: _, ...p }) => (
    <strong className="text-foreground font-medium" {...p} />
  ),
  blockquote: ({ node, ...p }) => {
    // "> [!NOTE]" and co. (shared/lib/doc-blocks): a callout.
    const tone = node?.properties.dataCallout
    if (isCalloutTone(tone))
      return <CalloutBox tone={tone}>{p.children}</CalloutBox>
    return (
      <blockquote
        className="border-border my-4 rounded-lg border border-l-[3px] px-4 py-1"
        {...p}
      />
    )
  },
  // A toggle (<details>, folded in by remarkDocBlocks): closed to start.
  details: ({ node: _, children }) => {
    const [summary, ...body] = Children.toArray(children)
    return (
      <details className="my-2">
        {summary}
        <div className="pl-7 [&>*:first-child]:mt-1 [&>*:last-child]:mb-0">
          {body}
        </div>
      </details>
    )
  },
  summary: ({ node: _, children }) => (
    <summary className="text-foreground flex cursor-pointer list-none items-start gap-1 font-medium select-none [&::-webkit-details-marker]:hidden">
      <span className="text-muted-foreground grid size-6 shrink-0 translate-y-0.5 place-items-center">
        <ChevronRight className="size-4 transition-transform duration-150 [details[open]>summary_&]:rotate-90" />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </summary>
  ),
  hr: () => <hr className="border-border my-6" />,
  code: ({ node: _, className, ...p }) => (
    <code
      className={cn(
        "bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]",
        className,
      )}
      {...p}
    />
  ),
  pre: ({ node: _, ...p }) => (
    <pre
      className="bg-muted text-meta my-4 overflow-x-auto rounded-lg p-3 [&>code]:bg-transparent [&>code]:p-0"
      {...p}
    />
  ),
  // The app's table style (see /table): the column labels on a pill, rows
  // with no lines, and the same sliding hover highlight as the lists.
  table: ({ node: _, ...p }) => (
    <div className="relative my-5 overflow-x-auto">
      <HoverHighlight
        itemSelector="tbody > tr"
        className="rounded-lg bg-(--row-hover)"
      />
      <table
        className={[
          "w-full border-separate border-spacing-0 text-left text-sm tabular-nums",
          "[&_th]:bg-muted dark:[&_th]:bg-muted/40 [&_th:first-child]:rounded-l-row [&_th:last-child]:rounded-r-row",
          "[&_tbody_tr]:relative",
          // A 2px spacer row under the labels + the highlight's 2px inset =
          // the 4px between rows, as in the lists.
          "[&_tbody]:before:table-row [&_tbody]:before:h-0.5",
        ].join(" ")}
        {...p}
      />
    </div>
  ),
  th: ({ node: _, ...p }) => (
    <th
      className="text-muted-foreground text-meta h-10 px-3 font-medium whitespace-nowrap"
      {...p}
    />
  ),
  td: ({ node: _, ...p }) => (
    <td className="h-12 px-3 py-2 align-middle first:font-medium" {...p} />
  ),
  img: () => null,
}

const textOf = (nodes: ElementContent[]): string =>
  nodes
    .map((n) =>
      n.type === "text"
        ? n.value
        : n.type === "element"
          ? textOf(n.children)
          : "",
    )
    .join("")

/** A paragraph holding only an embed link (shared/lib/embeds), if it is. */
function embedOf(node: Element | undefined) {
  const kids = node?.children.filter(
    (c) => !(c.type === "text" && !c.value.trim()),
  )
  const a = kids?.length === 1 ? kids[0] : null
  if (a?.type !== "element" || a.tagName !== "a") return null
  const href = a.properties.href
  const parsed = parseEmbedHref(typeof href === "string" ? href : null)
  return parsed ? { ...parsed, title: textOf(a.children) } : null
}

/** https, or the app's own paths (client pages serve storage via /r/media). */
const safeSrc = (src: unknown): src is string =>
  typeof src === "string" && /^(https:\/\/|\/(?!\/))/.test(src)

/** A paragraph of "#gallery" pictures only (shared/lib/doc-blocks). */
function galleryOf(node: Element | undefined) {
  const kids = node?.children.filter(
    (c) => !(c.type === "text" && !c.value.trim()) && c.type !== "comment",
  )
  if (!kids?.length) return null
  const images: GalleryImage[] = []
  for (const k of kids) {
    if (k.type !== "element") return null
    if (k.tagName === "br") continue
    const src = k.properties.src
    if (k.tagName !== "img" || typeof src !== "string" || !isGallerySrc(src))
      return null
    if (safeSrc(src))
      images.push({
        ...(parseGallerySrc(src) ?? { src }),
        alt: typeof k.properties.alt === "string" ? k.properties.alt : "",
      })
  }
  return images
}

/** Pictures, for documents that have them (project reports). */
const withImages: Components = {
  ...components,
  // A link on its own line with "#embed=…": a card or a live preview.
  p: ({ node, ...p }) => {
    const embed = embedOf(node)
    if (embed) return <EmbedBlock {...embed} />
    // Pictures marked "#gallery": one row that scrolls sideways.
    const gallery = galleryOf(node)
    if (gallery)
      return gallery.length ? <GalleryStrip images={gallery} /> : null
    return <p className="my-3 first:mt-0 last:mb-0" {...p} />
  },
  // Centred, at the width picked in the editor ("…#size=small|wide").
  img: ({ node: _, src, alt }) => {
    if (!safeSrc(src)) return null
    const size = /#size=(small|wide)$/.exec(src)?.[1]
    return (
      // Opens large on a click.
      <ZoomOnClickImage
        src={src}
        alt={alt ?? ""}
        className={cn(
          "border-border mx-auto my-4 block h-auto rounded-lg border",
          size === "small" ? "w-2/5" : size === "wide" ? "w-full" : "w-[70%]",
        )}
      />
    )
  },
}

export function Markdown({
  children,
  className,
  images = false,
}: {
  children: string
  className?: string
  /** Show images (https, or paths on this site). */
  images?: boolean
}) {
  const root = useRef<HTMLDivElement>(null)
  const body = (
    <div
      ref={root}
      className={cn("text-foreground/90 text-title leading-7", className)}
    >
      <ReactMarkdown
        // Callouts and toggles (shared/lib/doc-blocks); other raw HTML
        // stays dropped.
        remarkPlugins={[remarkGfm, remarkDocBlocks]}
        components={images ? withImages : components}
        // Keeps mention:// links (shown as pills above); the rest as usual.
        urlTransform={(url) =>
          url.startsWith(MENTION_SCHEME) ? url : defaultUrlTransform(url)
        }
      >
        {children}
      </ReactMarkdown>
    </div>
  )
  // Pictures open large, stepping through all of the document's.
  return images ? (
    <LightboxScope root={() => root.current}>{body}</LightboxScope>
  ) : (
    body
  )
}
