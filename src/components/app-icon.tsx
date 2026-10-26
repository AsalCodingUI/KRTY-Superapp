import { cn } from "@/lib/utils"

/**
 * The app icon (Icons/ in the repo root, rendered to public/icons): the
 * dark tile in either theme (a full-bleed square, so the caller rounds it),
 * or the "mark" alone on a transparent background: black in light mode,
 * white in dark mode.
 */
export function AppIcon({
  size = 96,
  variant = "tile",
  className,
}: {
  /** The tile (square background) or just the mark, transparent. */
  variant?: "tile" | "mark"
  /** Which PNG to load (it's shown at the className's size). Pick ~4× the
   *  shown size so it stays sharp on retina; 1024 (tile only) for a large
   *  hero icon like the sign-in screen's. */
  size?: 96 | 192 | 512 | 1024
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn("relative block shrink-0 overflow-hidden", className)}
    >
      {variant === "tile" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/icons/icon-dark-${size}.png`}
          alt=""
          className="size-full"
        />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/icons/mark-light-${size}.png`}
            alt=""
            className="size-full dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/icons/mark-dark-${size}.png`}
            alt=""
            className="hidden size-full dark:block"
          />
        </>
      )}
    </span>
  )
}
