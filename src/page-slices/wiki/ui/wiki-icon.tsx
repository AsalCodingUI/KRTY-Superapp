import { cn } from "@/lib/utils"
import { RiFileTextLine, RiTableLine } from "@/shared/ui/lucide-icons"

/** A wiki page's icon: its emoji, its picture, or the page / database
 *  glyph. `className` sizes it (the emoji follows the font size). */
export function WikiIcon({
  icon,
  kind = "page",
  className,
}: {
  icon: string | null | undefined
  kind?: "page" | "database"
  className?: string
}) {
  if (icon && /^https?:\/\//.test(icon))
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt=""
        className={cn("size-4 shrink-0 rounded-[3px] object-cover", className)}
      />
    )
  if (icon)
    return (
      <span
        aria-hidden
        className={cn(
          "inline-grid size-4 shrink-0 place-items-center text-[0.95rem] leading-none",
          className,
        )}
      >
        {icon}
      </span>
    )
  const Glyph = kind === "database" ? RiTableLine : RiFileTextLine
  return (
    <Glyph className={cn("text-muted-foreground size-4 shrink-0", className)} />
  )
}
