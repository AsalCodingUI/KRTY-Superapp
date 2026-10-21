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
        className="text-foreground/[0.07] pointer-events-none absolute inset-0 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]"
      />
      <div className="relative flex max-w-md flex-col items-center">
        <span
          aria-hidden
          className="from-foreground/70 to-foreground/5 bg-gradient-to-b bg-clip-text text-[7rem] leading-none font-semibold tracking-tighter text-transparent tabular-nums select-none sm:text-[9rem]"
        >
          {code}
        </span>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{title}</h1>
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
