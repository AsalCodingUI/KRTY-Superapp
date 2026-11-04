"use client"

import { cn } from "@/lib/utils"
import {
  embedDomain,
  embedInfo,
  faviconUrl,
  fallbackTitle,
  type EmbedView,
} from "@/shared/lib/embeds"
import { ExternalLink, Link2 } from "@/components/icons"
import { useState, type ReactNode } from "react"

/** The site's icon, or a link glyph when it has none. */
function SiteIcon({ url, className }: { url: string; className?: string }) {
  const src = faviconUrl(url)
  const [failed, setFailed] = useState(false)
  if (!src || failed)
    return <Link2 className={cn("text-muted-foreground", className)} />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      // Undo the editor's picture styles (DOC_PROSE styles every img).
      className={cn(
        "m-0! inline-block! rounded-[3px]! border-0! ring-0!",
        className,
      )}
    />
  )
}

/**
 * A link shown as a card or a live preview (see shared/lib/embeds). Used by
 * the editor and by `<Markdown images>`, so both read the same. While
 * editing (`editing`), the card isn't a link, so clicking picks it; the
 * small arrow still opens it.
 */
export function EmbedBlock({
  url,
  title,
  view,
  editing = false,
  footer,
}: {
  url: string
  title: string
  view: EmbedView
  editing?: boolean
  /** Extra controls under a preview (the editor's). */
  footer?: ReactNode
}) {
  const info = embedInfo(url)
  const name = title.trim() || fallbackTitle(url)
  const domain = embedDomain(url)
  const open = (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={domain}
      title={url}
      onMouseDown={(e) => e.stopPropagation()}
      className="text-muted-foreground! hover:text-foreground! hover:bg-muted -mr-1 grid size-7 shrink-0 place-items-center rounded-md transition-colors"
    >
      <ExternalLink className="size-3.5" />
    </a>
  )

  if (view !== "card" && info.src) {
    const portrait = info.aspect < 1
    return (
      <figure
        className={cn(
          "not-prose mx-auto my-4 w-full",
          portrait
            ? view === "preview-small"
              ? "max-w-[260px]"
              : "max-w-[380px]"
            : view === "preview-small" && "sm:w-[60%]",
        )}
      >
        <div
          className="border-border bg-muted relative w-full overflow-hidden rounded-lg border"
          style={{ aspectRatio: String(info.aspect) }}
        >
          <iframe
            src={info.src}
            title={name}
            loading="lazy"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms allow-storage-access-by-user-activation"
            className="absolute inset-0 size-full border-0"
          />
        </div>
        <figcaption className="text-muted-foreground text-meta mt-1.5 flex items-center gap-2 px-0.5 leading-5">
          <SiteIcon url={url} className="size-3.5 shrink-0" />
          <span className="text-muted-foreground min-w-0 truncate">{name}</span>
          <span className="shrink-0 truncate">· {domain}</span>
          <span className="flex-1" />
          {footer}
          {open}
        </figcaption>
      </figure>
    )
  }

  const body = (
    <>
      <span className="grid size-8 shrink-0 place-items-center">
        <SiteIcon url={url} className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-foreground text-meta truncate leading-4.5 font-medium">
          {name}
        </span>
        <span className="text-muted-foreground truncate text-xs leading-4">
          {domain}
        </span>
      </span>
    </>
  )
  // Hugs its text (up to a cap) instead of spanning the column. Concentric
  // corners: card radius = icon radius (6) + padding (6) = 12px.
  const card =
    "not-prose border-border bg-card my-3 flex w-fit max-w-full items-center gap-2.5 rounded-card border p-1.5 pr-3 no-underline! sm:max-w-sm"
  if (editing)
    return (
      <div className={card}>
        {body}
        {footer}
        {open}
      </div>
    )
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      title={url}
      className={cn(card, "hover:bg-accent transition-colors")}
    >
      {body}
      <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
    </a>
  )
}
