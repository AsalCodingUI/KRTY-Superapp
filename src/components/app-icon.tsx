import { cn } from "@/lib/utils"

/**
 * The app icon (Icons/ in the repo root, rendered to public/icons): the
 * tile, the colored mark on white in either theme (a full-bleed square, so
 * the caller rounds it), the "mark" alone on a transparent background:
 * black in light mode, white in dark mode, or the "badge": the mark in pure
 * white on the brand gradient (pink → coral → lilac, sampled from the
 * mark), as a workspace avatar.
 */
export function AppIcon({
  size = 96,
  variant = "tile",
  className,
}: {
  /** The tile (square background) or just the mark, transparent. */
  variant?: "tile" | "mark" | "badge"
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
        <img src={`/icons/icon-${size}.png`} alt="" className="size-full" />
      ) : variant === "badge" ? (
        <span className="block size-full bg-linear-135 from-[#FC699B] via-[#FF7763] to-[#C8B4FA] p-[5%]">
          {/* The white mark in either theme (mark-dark), ~60% of the tile. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/icons/mark-dark-${size === 1024 ? 512 : size}.png`}
            alt=""
            className="size-full"
          />
        </span>
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
