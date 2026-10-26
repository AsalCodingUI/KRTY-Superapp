"use client"

import { cn } from "@/lib/utils"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

/**
 * Reading styles for rule documents. Raw HTML in the source is not rendered
 * (react-markdown escapes it), so content written by admins stays plain text.
 */
const components: Components = {
  h1: ({ node: _, ...p }) => (
    <h2
      className="text-heading mt-8 mb-3 text-xl font-semibold tracking-tight first:mt-0"
      {...p}
    />
  ),
  h2: ({ node: _, ...p }) => (
    <h3
      className="text-heading mt-7 mb-2 text-base font-semibold first:mt-0"
      {...p}
    />
  ),
  h3: ({ node: _, ...p }) => (
    <h4
      className="text-heading mt-6 mb-2 text-sm font-semibold first:mt-0"
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
      className="marker:text-muted-foreground my-3 list-disc space-y-1.5 pl-5"
      {...p}
    />
  ),
  ol: ({ node: _, ...p }) => (
    <ol
      className="marker:text-muted-foreground my-3 list-decimal space-y-1.5 pl-5"
      {...p}
    />
  ),
  li: ({ node: _, ...p }) => (
    <li className="pl-1 [&>ol]:my-1.5 [&>ul]:my-1.5" {...p} />
  ),
  a: ({ node: _, ...p }) => (
    <a
      className="text-primary underline underline-offset-3 hover:no-underline"
      target="_blank"
      rel="noreferrer noopener"
      {...p}
    />
  ),
  strong: ({ node: _, ...p }) => (
    <strong className="text-foreground font-semibold" {...p} />
  ),
  blockquote: ({ node: _, ...p }) => (
    <blockquote
      className="border-border my-4 rounded-lg border border-l-[3px] px-4 py-1"
      {...p}
    />
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
      className="bg-muted my-4 overflow-x-auto rounded-lg p-3 text-[13px] [&>code]:bg-transparent [&>code]:p-0"
      {...p}
    />
  ),
  table: ({ node: _, ...p }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm" {...p} />
    </div>
  ),
  th: ({ node: _, ...p }) => (
    <th
      className="border-border text-muted-foreground border-b px-3 py-2 font-medium"
      {...p}
    />
  ),
  td: ({ node: _, ...p }) => (
    <td className="border-border/60 border-b px-3 py-2 align-top" {...p} />
  ),
  img: () => null,
}

/** Pictures, for documents that have them (project reports). */
const withImages: Components = {
  ...components,
  // Centred, at the width picked in the editor ("…#size=small|wide").
  img: ({ node: _, src, alt }) => {
    if (typeof src !== "string" || !/^https:\/\//.test(src)) return null
    const size = /#size=(small|wide)$/.exec(src)?.[1]
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ""}
        loading="lazy"
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
  /** Show images (https only); rules leave them out. */
  images?: boolean
}) {
  return (
    <div className={cn("text-foreground/90 text-[15px] leading-7", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={images ? withImages : components}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
