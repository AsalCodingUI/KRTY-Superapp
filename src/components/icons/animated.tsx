"use client"

import { cn } from "@/lib/utils"
import * as React from "react"

/** Imperative API every lucide-animated icon exposes. */
export interface AnimatedIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

type AnimatedIconSource = React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & {
    size?: number
  } & React.RefAttributes<AnimatedIconHandle>
>

export interface AnimatedIconProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  /** Pixel size of the svg (CSS `size-*` classes still win). */
  size?: number | string
  strokeWidth?: number | string
  color?: string
  /** Animate on hover of the icon itself instead of its interactive parent. */
  standalone?: boolean
}

/**
 * Elements whose hover/focus should play the icon animation. The icon looks for
 * the closest one so a whole button, menu item or nav link triggers it.
 */
const TRIGGER_SELECTOR = [
  "button",
  "a",
  "label",
  "[role=button]",
  "[role=menuitem]",
  "[role=menuitemradio]",
  "[role=menuitemcheckbox]",
  "[role=option]",
  "[role=tab]",
  "[data-slot=sidebar-menu-button]",
].join(",")

/**
 * Adapts a lucide-animated icon so it can be used exactly like a lucide-react
 * icon (`className`, `size`, `strokeWidth`, aria props) while animating when its
 * interactive ancestor is hovered or keyboard-focused.
 */
export function animated(Icon: AnimatedIconSource, displayName: string) {
  const Wrapped = React.forwardRef<SVGSVGElement, AnimatedIconProps>(
    function AnimatedIcon(
      { className, size = 24, strokeWidth, color, standalone = false, style, ...props },
      _ref,
    ) {
      const anchorRef = React.useRef<HTMLSpanElement>(null)
      const handleRef = React.useRef<AnimatedIconHandle>(null)

      React.useEffect(() => {
        if (standalone) return
        const anchor = anchorRef.current
        const trigger =
          anchor?.closest<HTMLElement>(TRIGGER_SELECTOR) ?? anchor?.parentElement
        if (!trigger) return
        const start = () => handleRef.current?.startAnimation()
        const stop = () => handleRef.current?.stopAnimation()
        const onFocusIn = (e: FocusEvent) => {
          if ((e.target as HTMLElement).matches(":focus-visible")) start()
        }
        trigger.addEventListener("pointerenter", start)
        trigger.addEventListener("pointerleave", stop)
        trigger.addEventListener("focusin", onFocusIn)
        trigger.addEventListener("focusout", stop)
        return () => {
          trigger.removeEventListener("pointerenter", start)
          trigger.removeEventListener("pointerleave", stop)
          trigger.removeEventListener("focusin", onFocusIn)
          trigger.removeEventListener("focusout", stop)
        }
      }, [standalone])

      const px = typeof size === "number" ? size : Number.parseFloat(size) || 24
      // When the caller sizes the wrapper (size-4, w-5 …) the svg must fill it;
      // otherwise leave the svg alone so parent rules like [&_svg]:size-3.5 apply.
      const sizedByClass = /(^|\s)(\S*:)?(size|w|h)-\S+/.test(className ?? "")

      return (
        <span ref={anchorRef} className="contents">
          <Icon
            ref={standalone ? undefined : handleRef}
            size={px}
            className={cn(
              "inline-flex shrink-0 items-center justify-center [&>svg]:[stroke-width:var(--icon-stroke)]",
              sizedByClass && "[&>svg]:size-full",
              className,
            )}
            style={
              {
                "--icon-stroke": strokeWidth ?? 1.5,
                color,
                ...style,
              } as React.CSSProperties
            }
            {...props}
          />
        </span>
      )
    },
  )
  Wrapped.displayName = displayName
  return Wrapped
}
