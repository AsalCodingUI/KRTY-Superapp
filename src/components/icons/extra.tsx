"use client"

// Extra animated icons drawn in the lucide-animated style for icons that
// library doesn't ship. Same contract as the vendored ones: an imperative
// start/stop handle, wrapped by `animated()` in ./index.ts.

import type { Variants } from "motion/react"
import { m, useAnimation } from "motion/react"
import type { HTMLAttributes, ReactNode } from "react"
import { forwardRef, useImperativeHandle } from "react"

import { cn } from "@/lib/utils"
import type { AnimatedIconHandle } from "./animated"

interface IconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
}

type Controls = ReturnType<typeof useAnimation>

/** Builds an icon whose svg (`svg` variants) and parts (`render`) share one controller. */
function makeIcon(
  name: string,
  render: (controls: Controls) => ReactNode,
  svg?: Variants,
  origin = "12px 12px",
) {
  const Icon = forwardRef<AnimatedIconHandle, IconProps>(
    ({ className, size = 28, ...props }, ref) => {
      const controls = useAnimation()
      useImperativeHandle(ref, () => ({
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      }))
      return (
        <div className={cn(className)} {...props}>
          <m.svg
            animate={svg ? controls : undefined}
            initial="normal"
            variants={svg}
            fill="none"
            height={size}
            width={size}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            style={{ transformOrigin: origin, overflow: "visible" }}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {render(controls)}
          </m.svg>
        </div>
      )
    },
  )
  Icon.displayName = `${name}Icon`
  return Icon
}

const EASE = [0.23, 1, 0.32, 1] as const

/** Draws a stroke in, optionally staggered by `custom` index. */
const DRAW: Variants = {
  normal: { pathLength: 1, opacity: 1, transition: { duration: 0.2 } },
  animate: (i: number = 0) => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: { duration: 0.35, delay: i * 0.1, ease: EASE },
  }),
}

/** Blinks a part out and back, staggered by `custom` index. */
const BLINK: Variants = {
  normal: { opacity: 1, transition: { duration: 0.2 } },
  animate: (i: number = 0) => ({
    opacity: [1, 0.15, 1],
    transition: { duration: 0.4, delay: i * 0.07 },
  }),
}

const WIGGLE: Variants = {
  normal: { rotate: 0, transition: { duration: 0.3, ease: "easeOut" } },
  animate: {
    rotate: [0, -10, 8, -5, 0],
    transition: { duration: 0.5, ease: "easeInOut" },
  },
}

const BOB: Variants = {
  normal: { y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  animate: {
    y: [0, -2.5, 0],
    transition: { duration: 0.45, ease: "easeInOut" },
  },
}

export const BookOpenIcon = makeIcon("BookOpen", (c) => (
  <>
    <path d="M12 7v14" />
    <m.path
      animate={c}
      variants={{
        normal: { scaleX: 1, transition: { duration: 0.3 } },
        animate: {
          scaleX: [1, 0.82, 1],
          transition: { duration: 0.5, ease: "easeInOut" },
        },
      }}
      style={{ transformOrigin: "12px 12px" }}
      d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
    />
  </>
))

export const Building2Icon = makeIcon("Building2", (c) => (
  <>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    {["M10 6h4", "M10 10h4", "M10 14h4", "M10 18h4"].map((d, i) => (
      <m.path key={d} d={d} animate={c} variants={BLINK} custom={3 - i} />
    ))}
  </>
))

export const WorkflowIcon = makeIcon("Workflow", (c) => (
  <>
    <rect width="8" height="8" x="3" y="3" rx="2" />
    <m.path
      d="M7 11v4a2 2 0 0 0 2 2h4"
      animate={c}
      variants={DRAW}
      custom={0}
    />
    <m.rect
      width="8"
      height="8"
      x="13"
      y="13"
      rx="2"
      animate={c}
      variants={{
        normal: { scale: 1, transition: { duration: 0.2 } },
        animate: {
          scale: [1, 0.8, 1],
          transition: { duration: 0.35, delay: 0.25, ease: EASE },
        },
      }}
      style={{ transformOrigin: "17px 17px" }}
    />
  </>
))

export const CreditCardIcon = makeIcon(
  "CreditCard",
  () => (
    <>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </>
  ),
  {
    normal: { x: 0, rotate: 0, transition: { duration: 0.3 } },
    animate: {
      x: [0, 2.5, 0],
      rotate: [0, -8, 0],
      transition: { duration: 0.5, ease: "easeInOut" },
    },
  },
)

export const ListChecksIcon = makeIcon("ListChecks", (c) => (
  <>
    <m.path d="m3 7 2 2 4-4" animate={c} variants={DRAW} custom={0} />
    <m.path d="m3 17 2 2 4-4" animate={c} variants={DRAW} custom={2} />
    <path d="M13 6h8" />
    <path d="M13 12h8" />
    <path d="M13 18h8" />
  </>
))

export const CalculatorIcon = makeIcon("Calculator", (c) => (
  <>
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <line x1="8" x2="16" y1="6" y2="6" />
    <line x1="16" x2="16" y1="14" y2="18" />
    {[
      "M8 10h.01",
      "M12 10h.01",
      "M16 10h.01",
      "M8 14h.01",
      "M12 14h.01",
      "M8 18h.01",
      "M12 18h.01",
    ].map((d, i) => (
      <m.path key={d} d={d} animate={c} variants={BLINK} custom={i} />
    ))}
  </>
))

export const CalendarClockIcon = makeIcon("CalendarClock", (c) => (
  <>
    <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h5" />
    <circle cx="16" cy="16" r="6" />
    <m.path
      d="M16 14v2.3l1.5 1.2"
      animate={c}
      variants={{
        normal: { rotate: 0, transition: { duration: 0.3 } },
        animate: {
          rotate: 360,
          transition: { duration: 0.6, ease: "easeInOut" },
        },
      }}
      style={{ transformOrigin: "16px 16px" }}
    />
  </>
))

export const InfoIcon = makeIcon("Info", (c) => (
  <>
    <circle cx="12" cy="12" r="10" />
    <m.path d="M12 16v-4" animate={c} variants={DRAW} custom={1} />
    <m.path d="M12 8h.01" animate={c} variants={BOB} />
  </>
))

export const MonitorIcon = makeIcon("Monitor", (c) => (
  <>
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <m.path
      d="M6 10h12"
      initial="normal"
      animate={c}
      variants={{
        normal: { pathLength: 0, opacity: 0, transition: { duration: 0.2 } },
        animate: {
          pathLength: [0, 1, 1],
          opacity: [0, 1, 0],
          transition: { duration: 0.6, ease: "easeInOut" },
        },
      }}
    />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </>
))

const TRIANGLE =
  "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"

export const TriangleAlertIcon = makeIcon(
  "TriangleAlert",
  () => (
    <>
      <path d={TRIANGLE} />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  WIGGLE,
  "12px 20px",
)

export const CircleAlertIcon = makeIcon(
  "CircleAlert",
  () => (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </>
  ),
  WIGGLE,
)

export const MailIcon = makeIcon("Mail", (c) => (
  <>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <m.path
      d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
      animate={c}
      variants={{
        normal: { scaleY: 1, transition: { duration: 0.3 } },
        animate: {
          scaleY: [1, -0.6, 1],
          transition: { duration: 0.55, ease: "easeInOut" },
        },
      }}
      style={{ transformOrigin: "12px 7px" }}
    />
  </>
))

export const PrinterIcon = makeIcon("Printer", (c) => (
  <>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
    <m.rect
      x="6"
      y="14"
      width="12"
      height="8"
      rx="1"
      animate={c}
      variants={{
        normal: { y: 0, transition: { duration: 0.3 } },
        animate: {
          y: [0, 2, 0],
          transition: { duration: 0.5, ease: "easeInOut" },
        },
      }}
    />
  </>
))

export const ArrowUpRightIcon = makeIcon("ArrowUpRight", (c) => (
  <m.g
    animate={c}
    variants={{
      normal: { x: 0, y: 0, transition: { duration: 0.25, ease: EASE } },
      animate: {
        x: [0, 2, 0],
        y: [0, -2, 0],
        transition: { duration: 0.4, ease: "easeInOut" },
      },
    }}
  >
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </m.g>
))

export const MoreHorizontalIcon = makeIcon("MoreHorizontal", (c) => (
  <>
    {[5, 12, 19].map((cx, i) => (
      <m.circle
        key={cx}
        cx={cx}
        cy="12"
        r="1"
        animate={c}
        custom={i}
        variants={{
          normal: { y: 0, transition: { duration: 0.2 } },
          animate: (j: number) => ({
            y: [0, -2.5, 0],
            transition: { duration: 0.35, delay: j * 0.08 },
          }),
        }}
      />
    ))}
  </>
))

export const MoreVerticalIcon = makeIcon("MoreVertical", (c) => (
  <>
    {[5, 12, 19].map((cy, i) => (
      <m.circle
        key={cy}
        cx="12"
        cy={cy}
        r="1"
        animate={c}
        custom={i}
        variants={{
          normal: { x: 0, transition: { duration: 0.2 } },
          animate: (j: number) => ({
            x: [0, 2.5, 0],
            transition: { duration: 0.35, delay: j * 0.08 },
          }),
        }}
      />
    ))}
  </>
))

export const SaveIcon = makeIcon(
  "Save",
  () => (
    <>
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </>
  ),
  {
    normal: { scale: 1, transition: { duration: 0.2 } },
    animate: {
      scale: [1, 0.86, 1.04, 1],
      transition: { duration: 0.45, ease: "easeInOut" },
    },
  },
)

export const ColumnsIcon = makeIcon("Columns2", (c) => (
  <>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <m.path
      d="M12 3v18"
      animate={c}
      variants={{
        normal: { x: 0, transition: { duration: 0.3 } },
        animate: {
          x: [0, -3, 2, 0],
          transition: { duration: 0.55, ease: "easeInOut" },
        },
      }}
    />
  </>
))

export const RowsIcon = makeIcon("Rows2", (c) => (
  <>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <m.path
      d="M3 12h18"
      animate={c}
      variants={{
        normal: { y: 0, transition: { duration: 0.3 } },
        animate: {
          y: [0, -3, 2, 0],
          transition: { duration: 0.55, ease: "easeInOut" },
        },
      }}
    />
  </>
))

export const PlayIcon = makeIcon(
  "Play",
  () => (
    <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
  ),
  {
    normal: { x: 0, scale: 1, transition: { duration: 0.2 } },
    animate: {
      x: [0, 1.5, 0],
      scale: [1, 0.9, 1],
      transition: { duration: 0.4, ease: "easeInOut" },
    },
  },
)
