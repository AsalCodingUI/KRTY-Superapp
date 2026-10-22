import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/**
 * Full-page state for 404 / errors: a large soft code over a dotted field,
 * a short title and next steps. No card, no alarm colours.
 */
export function StatusPage({
  code,
  title,
  description,
  detail,
  actions,
  className,
}: {
  /** Big glyph, e.g. "404" or "!" */
  code: string
  title: string
  description: string
  /** Small mono line, e.g. the missing path or an error id. */
  detail?: string | null
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-[calc(100svh-6rem)] w-full flex-col items-center justify-center overflow-hidden px-6 py-16 text-center",
        className,
      )}
    >
      {/* Dotted field fading out from the centre. */}
      <div
        aria-hidden
        className="text-foreground/[0.07] pointer-events-none absolute inset-0 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)] [background-size:22px_22px]"
      />
      <div className="relative flex max-w-md flex-col items-center">
        {/* Padding gives tall glyphs like "(" room: bg-clip-text only paints
            inside the box, so anything past the line box would be cut. */}
        <span
          aria-hidden
          className={cn(
            "from-foreground/70 to-foreground/5 bg-gradient-to-b bg-clip-text px-[0.08em] py-[0.12em] text-[7rem] leading-none font-semibold text-transparent tabular-nums select-none sm:text-[9rem]",
            // Tight tracking suits "404"; on a two-glyph face it shifts it off centre.
            code.length > 2 && "tracking-tighter",
          )}
        >
          {code}
        </span>
        <h1 className="text-heading mt-1 text-xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-balance">
          {description}
        </p>
        {detail && (
          <code className="bg-muted text-muted-foreground mt-4 max-w-full truncate rounded-md px-2 py-1 font-mono text-xs">
            {detail}
          </code>
        )}
        {actions && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
