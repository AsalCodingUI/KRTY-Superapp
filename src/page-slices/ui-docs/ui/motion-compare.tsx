"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DURATION, EASE_OUT, TRANSITION } from "@/shared/lib/motion"
import { RiNotification3Line, RiRefreshLine } from "@/shared/ui/lucide-icons"
import { m } from "motion/react"
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { BeforeAfter } from "./compare"

/**
 * /ui → Motion, "Sebelum / sesudah": the old curves, durations, bars and
 * dead animations drawn as they were (left), the shared tokens as the app
 * runs them now (right), then the live values read from the page.
 */

function Replay({ onClick }: { onClick: () => void }) {
  return (
    <div>
      <Button variant="outline" size="sm" onClick={onClick}>
        <RiRefreshLine data-icon="inline-start" />
        Putar ulang
      </Button>
    </div>
  )
}

/** A dot crossing a track with the given transition classes. */
function Track({
  label,
  cls,
  on,
}: {
  label: string
  cls: string
  on: boolean
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <code className="text-caption text-muted-foreground font-mono">
        {label}
      </code>
      <div className="bg-muted relative h-5 w-52 rounded-full">
        <span
          className={cn(
            "bg-primary absolute top-0.5 left-0.5 size-4 rounded-full transition-transform motion-reduce:transition-none",
            cls,
            on && "translate-x-[11.75rem]",
          )}
        />
      </div>
    </div>
  )
}

const TIMING: [string, string, string, string][] = [
  // [what, old label, old classes, new classes]
  ["Tooltip", "125ms", "duration-[125ms] ease-out", "duration-150 ease-out"],
  ["Zoom pill", "180ms", "duration-[180ms] ease-out", "duration-150 ease-out"],
  ["Angka", "220ms", "duration-[220ms] ease-out", "duration-200 ease-out"],
  ["Dialog", "250ms", "duration-250 ease-out", "duration-200 ease-out"],
  [
    "Sidebar",
    "ease-linear",
    "duration-200 ease-linear",
    "duration-200 ease-out",
  ],
  [
    "Kanban drop",
    "(0.2,0,0,1) 220ms",
    "duration-[220ms] ease-[cubic-bezier(0.2,0,0,1)]",
    "duration-200 ease-out",
  ],
]

function TimingCompare() {
  const [on, setOn] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <BeforeAfter
        label="Durasi & kurva: 125 / 180 / 220 / 250ms, linear → 150 / 200 + ease-out"
        before={
          <div className="flex flex-col gap-3">
            {TIMING.map(([what, old, cls]) => (
              <Track key={what} label={`${what} · ${old}`} cls={cls} on={on} />
            ))}
          </div>
        }
        after={
          <div className="flex flex-col gap-3">
            {TIMING.map(([what, , , cls]) => (
              <Track
                key={what}
                label={`${what} · ${cls.replace(" ease-out", "")}`}
                cls={cls}
                on={on}
              />
            ))}
          </div>
        }
      />
      <Replay onClick={() => setOn((v) => !v)} />
    </div>
  )
}

const BARS = [72, 45, 18]

function BarCompare() {
  const [run, setRun] = useState(0)
  return (
    <div className="flex flex-col gap-3">
      <BeforeAfter
        label="Bar: m.div animate={{ width }} per baris / transition-[width] 700ms → bar-grow (600ms)"
        before={
          <div className="flex w-52 flex-col gap-3">
            {/* ProjectScoringView: a motion width tween per row, "easeOut". */}
            {BARS.map((v) => (
              <div key={`${run}-${v}`} className="bg-muted h-2 rounded-full">
                <m.div
                  className="bg-primary h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${v}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            ))}
            {/* ReviewResult: a width transition, which never runs on mount. */}
            <div key={run} className="bg-muted h-2 rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: "60%" }}
              />
            </div>
            <span className="text-tertiary-foreground text-meta">
              Bar terakhir langsung penuh: transition nggak jalan pas muncul
            </span>
          </div>
        }
        after={
          <div className="flex w-52 flex-col gap-3">
            {[...BARS, 60].map((v, i) => (
              <div key={`${run}-${i}`} className="bg-muted h-2 rounded-full">
                <div
                  className="bar-grow bg-primary h-full rounded-full"
                  style={{ "--bar": `${v}%` } as CSSProperties}
                />
              </div>
            ))}
            <span className="text-tertiary-foreground text-meta">
              Satu utility CSS: tumbuh sekali pas muncul, meluncur pas nilainya
              berubah
            </span>
          </div>
        }
      />
      <Replay onClick={() => setRun((n) => n + 1)} />
    </div>
  )
}

function Chip({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "bg-background shadow-raised text-body flex items-center gap-2 rounded-xl px-4 py-3",
        className,
      )}
    >
      {children}
    </div>
  )
}

function EnterCompare() {
  const [run, setRun] = useState(0)
  return (
    <div className="flex flex-col gap-3">
      <BeforeAfter
        label="animate-fadeIn (keyframe-nya nggak ada) → enter-rise"
        before={
          <div className="flex min-h-14 flex-col gap-2">
            <Chip key={run} className="animate-fadeIn">
              <span className="text-destructive-ink font-medium">
                Hapus acara ini?
              </span>
            </Chip>
            <span className="text-tertiary-foreground text-meta">
              Muncul gitu aja: class-nya nggak ngapa-ngapain
            </span>
          </div>
        }
        after={
          <div className="flex min-h-14 flex-col gap-2">
            <Chip key={run} className="enter-rise">
              <span className="text-destructive-ink font-medium">
                Hapus acara ini?
              </span>
            </Chip>
            <span className="text-tertiary-foreground text-meta">
              Naik 8px + fade 300ms; kurangi gerak: fade aja
            </span>
          </div>
        }
      />
      <Replay onClick={() => setRun((n) => n + 1)} />
    </div>
  )
}

function SwapCompare() {
  const [run, setRun] = useState(0)
  return (
    <div className="flex flex-col gap-3">
      <BeforeAfter
        label="const EASE di tiap file + durasi sendiri → TRANSITION dari shared/lib/motion"
        before={
          <div className="flex min-h-14 flex-col gap-2">
            <m.div
              key={run}
              initial={run ? { opacity: 0, y: 4 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            >
              <Chip>Kartu baru · 0.25s</Chip>
            </m.div>
            <code className="text-caption text-muted-foreground font-mono">
              const EASE = [0.23, 1, 0.32, 1] ×8 file
            </code>
          </div>
        }
        after={
          <div className="flex min-h-14 flex-col gap-2">
            <m.div
              key={run}
              initial={run ? { opacity: 0, y: 4 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={TRANSITION}
            >
              <Chip>Kartu baru · {TRANSITION.duration}s</Chip>
            </m.div>
            <code className="text-caption text-muted-foreground font-mono">
              import {"{ TRANSITION }"} from &quot;@/shared/lib/motion&quot;
            </code>
          </div>
        }
      />
      <Replay onClick={() => setRun((n) => n + 1)} />
    </div>
  )
}

function BellCompare() {
  return (
    <BeforeAfter
      label="Lonceng belum dibaca: animate-ping terus-terusan → titik diam"
      before={
        <span className="relative">
          <RiNotification3Line className="size-5" />
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex size-2">
            <span className="bg-destructive absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
            <span className="bg-destructive relative inline-flex size-2 rounded-full" />
          </span>
        </span>
      }
      after={
        <span className="relative">
          <RiNotification3Line className="size-5" />
          <span className="bg-destructive absolute top-0 right-0 -mt-1 -mr-1 size-2 rounded-full" />
        </span>
      }
    />
  )
}

export function MotionCompare() {
  return (
    <div className="flex flex-col gap-8">
      <TimingCompare />
      <SwapCompare />
      <BarCompare />
      <EnterCompare />
      <BellCompare />
      <Measured />
    </div>
  )
}

/** What each sample reads: a transition or an animation. */
const SAMPLES: [string, string, "transition" | "animation"][] = [
  ["duration-150 ease-out", "hover, warna, tooltip", "transition"],
  ["duration-200 ease-out", "default: baris, collapse, dialog", "transition"],
  ["duration-300 ease-out", "kedatangan besar", "transition"],
  ["duration-300 ease-drawer", "sheet, drawer", "transition"],
  ["enter-rise", "muncul jarang", "transition"],
  ["bar-grow", "isi bar / meter", "transition"],
  ["animate-tab-enter", "isi tab setelah pindah", "animation"],
  ["animate-count-pop", "angka badge naik", "animation"],
  ["animate-footer-in", "footer sidebar", "animation"],
]

/** Shorter curve names, so the measured column reads at a glance. */
function curveName(v: string) {
  const c = v.replace(/\s+/g, "")
  if (c.includes("0.23,1,0.32,1")) return "ease-out ✓"
  if (c.includes("0.32,0.72,0,1")) return "ease-drawer ✓"
  return v
}

function Measured() {
  const refs = useRef<(HTMLSpanElement | null)[]>([])
  const [rows, setRows] = useState<string[]>([])
  const [match, setMatch] = useState("")
  const [reduce, setReduce] = useState<boolean | null>(null)
  useEffect(() => {
    setReduce(matchMedia("(prefers-reduced-motion: reduce)").matches)
    setRows(
      SAMPLES.map(([, , kind], i) => {
        const el = refs.current[i]
        if (!el) return ""
        const cs = getComputedStyle(el)
        const [prop, dur, fn] =
          kind === "animation"
            ? [
                cs.animationName,
                cs.animationDuration,
                cs.animationTimingFunction,
              ]
            : [
                cs.transitionProperty,
                cs.transitionDuration,
                cs.transitionTimingFunction,
              ]
        // Several properties share one duration / curve: show it once.
        const first = (v: string) => v.split(/,(?![^(]*\))/)[0].trim()
        return `${prop} · ${first(dur)} · ${curveName(first(fn))}`
      }),
    )
    // The JS ease and the CSS token must be the same curve.
    const css = getComputedStyle(document.documentElement)
      .getPropertyValue("--ease-out")
      .replace(/\s+/g, "")
    const js = `cubic-bezier(${EASE_OUT.join(",")})`
    setMatch(
      `--ease-out = ${css || "?"} · EASE_OUT = [${EASE_OUT.join(", ")}] ${css === js ? "✓ sama" : "✕ beda"} · DURATION = ${DURATION.fast} / ${DURATION.base} / ${DURATION.slow}s`,
    )
  }, [])
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">
        Diukur dari CSS yang jalan
        {reduce && (
          <span className="text-tertiary-foreground text-meta ms-2 font-normal">
            kurangi gerak aktif: animasi CSS dimatikan
          </span>
        )}
      </h3>
      <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
        <div className="bg-background flex flex-col rounded-lg py-1">
          {SAMPLES.map(([c, role], i) => (
            <div
              key={c}
              className="gutter-x grid min-h-12 grid-cols-[minmax(0,13rem)_minmax(0,1fr)] items-center gap-x-4 py-2 sm:grid-cols-[13rem_minmax(0,1fr)_auto]"
            >
              <code className="text-caption truncate font-mono">{c}</code>
              <span className="text-muted-foreground text-meta hidden truncate sm:block">
                {role}
              </span>
              <span className="text-tertiary-foreground text-meta tabular-nums">
                {rows[i] || "…"}
              </span>
              <span
                aria-hidden
                ref={(el) => {
                  refs.current[i] = el
                }}
                // transition-transform so the duration-* samples have a
                // property; the token utilities bring their own.
                className={cn(
                  "pointer-events-none fixed size-0 opacity-0",
                  c.startsWith("duration") && "transition-transform",
                  c,
                )}
              />
            </div>
          ))}
        </div>
      </div>
      <p className="text-tertiary-foreground text-meta">{match}</p>
    </div>
  )
}
