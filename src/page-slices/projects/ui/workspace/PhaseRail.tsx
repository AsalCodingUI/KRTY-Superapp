"use client"

import { surfaceClassName } from "@/components/panel"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  daysBetween,
  jakartaDay,
  todayJakarta,
} from "@/entities/performance/lib/kpi-phases"
import { cn } from "@/lib/utils"
import { ContextTarget, type CtxItem } from "@/shared/context-menu"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  RiAddLine,
  RiCalendarScheduleLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiMoreFill,
} from "@/shared/ui/lucide-icons"
import { format, parseISO } from "date-fns"
import {
  ArrowLeft,
  ArrowRight,
  CircleDot,
  ListChecks,
  Pencil,
  Settings2,
  Trash2,
} from "@/components/icons"
import { AnimatePresence, m, useReducedMotion } from "motion/react"
import { TRANSITION } from "@/shared/lib/motion"
import { useEffect, useRef, useState } from "react"
import type { PhaseRow } from "./data"

/* The phase rail, on its own so the client portal can show it without
   pulling in the team's whole dashboard. */

export const PHASE_NAME_MAX = 40
export function clip(name: string, max = 28) {
  return name.length > max ? `${name.slice(0, max - 1).trimEnd()}…` : name
}

/**
 * The project's phases as one thin progress rail (left to right): a filled
 * segment per finished phase, the active one filled by its finished steps.
 * Long names truncate (full name on hover); with many phases each keeps a
 * minimum width and the rail scrolls sideways, fading at the edges, with the
 * selected phase kept in view.
 */
export function PhaseRail({
  phases,
  steps,
  selectedId,
  onSelect,
  isAdmin,
  onAdd,
  onActivate,
  onRename,
  onMove,
  onDelete,
  onSettings,
  onComplete,
  onCompleteUpTo,
  onStopPhases,
  showMissingDue,
}: {
  phases: PhaseRow[]
  steps: { phase_id: string | null; status: string }[]
  selectedId: string | null
  onSelect: (id: string) => void
  isAdmin: boolean
  onAdd: () => void
  onActivate: (phase: PhaseRow) => void
  onRename: (phase: PhaseRow) => void
  onMove: (phase: PhaseRow, delta: -1 | 1) => void
  onDelete: (phase: PhaseRow) => void
  /** Opens the phase settings (due dates, weights), on a phase or all. */
  onSettings: (phase?: PhaseRow) => void
  /** Finishes the running phase (its ⋯ menu); admins only. */
  onComplete?: () => void
  /** Marks a later phase and every one before it done (right-click). */
  onCompleteUpTo?: (phase: PhaseRow) => void
  /** "Jangan pakai fase" (the rail's ⋯ menu); admins only. */
  onStopPhases?: () => void
  showMissingDue: boolean
}) {
  const t = useT("projects")
  const dateLocale = useDateLocale()
  const reduce = useReducedMotion()
  const scroller = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })
  // Days are Jakarta days, the same ones the KPI scores by.
  const today = todayJakarta()
  const shortDay = (d: string) =>
    format(parseISO(d), "d MMM", { locale: dateLocale })
  const missingDue = phases.filter((p) => !p.due_date).length

  // Fade only the side(s) that have more phases to scroll to.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const update = () =>
      setEdges({
        start: el.scrollLeft > 1,
        end: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      })
    update()
    el.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [phases.length])

  // Keep the selected phase in view when the rail scrolls.
  useEffect(() => {
    scroller.current
      ?.querySelector<HTMLElement>("[data-selected]")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [selectedId])

  const fade = 24
  const mask =
    edges.start || edges.end
      ? `linear-gradient(to right, ${edges.start ? "transparent" : "#000"}, #000 ${fade}px, #000 calc(100% - ${fade}px), ${edges.end ? "transparent" : "#000"})`
      : undefined

  return (
    <section className="flex flex-col gap-3">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="text-foreground shrink-0 font-medium">
            {t("phasesTitle")}
          </span>
          {/* Without due dates the KPI can't judge a phase; say so here. */}
          <AnimatePresence initial={false}>
            {isAdmin && showMissingDue && missingDue > 0 && (
              <m.div
                initial={reduce ? false : { opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -4 }}
                transition={TRANSITION}
                className="bg-warning-subtle ml-1 flex min-w-0 items-center gap-1.5 rounded-full py-0.5 pr-0.5 pl-2 text-xs"
              >
                <RiErrorWarningLine className="text-warning size-3.5 shrink-0" />
                <span className="text-muted-foreground min-w-0 truncate">
                  {t("phasesMissingDue", { n: missingDue })}
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-foreground shrink-0"
                  onClick={() => onSettings()}
                >
                  {t("phaseSetDue")}
                </Button>
              </m.div>
            )}
          </AnimatePresence>
        </div>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("phaseActions")}
                  className="text-muted-foreground"
                />
              }
            >
              <RiMoreFill />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {phases.length > 0 && (
                <DropdownMenuItem onClick={() => onSettings()}>
                  <RiCalendarScheduleLine />
                  {t("phaseSettings")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onAdd}>
                <RiAddLine />
                {t("addPhase")}
              </DropdownMenuItem>
              {onStopPhases && phases.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={onStopPhases}
                  >
                    <RiDeleteBinLine />
                    {t("stopPhases")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div
        ref={scroller}
        className="-m-1 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        <ol
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${phases.length || 1}, minmax(12rem, 1fr))`,
          }}
        >
          {phases.map((phase, i) => {
            const phaseSteps = steps.filter((s) => s.phase_id === phase.id)
            const doneSteps = phaseSteps.filter(
              (s) => s.status === "done",
            ).length
            const selected = phase.id === selectedId
            const isDone = phase.status === "done"
            const isActive = phase.status === "active"
            const fill = isDone
              ? 100
              : phaseSteps.length
                ? (doneSteps / phaseSteps.length) * 100
                : 0
            const doneDay = phase.completed_at
              ? jakartaDay(phase.completed_at)
              : null
            const status = isDone
              ? t("phaseDoneOn", { date: doneDay ? shortDay(doneDay) : "" })
              : isActive
                ? t("phaseInProgress")
                : t("phaseNotStarted")
            // Late is late either way: still open past the due date
            // (automatic Delay), or finished after it.
            const due = phase.due_date
            const overdueDays =
              due && !isDone && today > due ? daysBetween(due, today) : 0
            const overdue = overdueDays > 0
            const lateBy =
              due && isDone && doneDay && doneDay > due
                ? daysBetween(due, doneDay)
                : 0
            const dueTitle = overdue
              ? t("phaseOverdueTitle", { days: overdueDays })
              : lateBy
                ? t("phaseDoneLateTitle", { days: lateBy })
                : undefined
            // Right-click: show its steps; admins also get the status
            // (a pick-one submenu) and the ⋯ actions.
            const phaseItems = (): CtxItem[] => [
              {
                id: "steps",
                label: t("ctxShowSteps"),
                icon: ListChecks,
                hidden: selected,
                onSelect: () => onSelect(phase.id),
              },
              {
                id: "status",
                label: t("colStatus"),
                icon: CircleDot,
                hint: isDone
                  ? t("statusCompleted")
                  : isActive
                    ? t("phaseInProgress")
                    : t("phaseNotStarted"),
                hidden: !isAdmin,
                submenu: [
                  {
                    id: "todo",
                    label: t("phaseNotStarted"),
                    role: "radio",
                    checked: phase.status === "todo",
                    // Not started = the one before it is the running one.
                    disabled: i === 0,
                    hint: i === 0 ? t("ctxPhaseFirstTodo") : undefined,
                    onSelect: () => {
                      if (phase.status !== "todo" && i > 0)
                        onActivate(phases[i - 1])
                    },
                  },
                  {
                    id: "active",
                    label: t("phaseInProgress"),
                    role: "radio",
                    checked: isActive,
                    onSelect: () => {
                      if (!isActive) onActivate(phase)
                    },
                  },
                  {
                    id: "done",
                    label: t("statusCompleted"),
                    role: "radio",
                    checked: isDone,
                    onSelect: () => {
                      if (isDone) return
                      // The running one asks first, as in its ⋯ menu.
                      if (isActive && onComplete) onComplete()
                      else onCompleteUpTo?.(phase)
                    },
                  },
                ],
              },
              {
                id: "rename",
                label: t("renamePhase"),
                icon: Pencil,
                hidden: !isAdmin,
                onSelect: () => onRename(phase),
              },
              {
                id: "settings",
                label: t("phaseSettings"),
                icon: Settings2,
                hidden: !isAdmin,
                onSelect: () => onSettings(phase),
              },
              {
                id: "left",
                label: t("movePhaseLeft"),
                icon: ArrowLeft,
                hidden: !isAdmin,
                disabled: i === 0,
                onSelect: () => onMove(phase, -1),
              },
              {
                id: "right",
                label: t("movePhaseRight"),
                icon: ArrowRight,
                hidden: !isAdmin,
                disabled: i === phases.length - 1,
                onSelect: () => onMove(phase, 1),
              },
              {
                id: "delete",
                label: t("deletePhase"),
                icon: Trash2,
                destructive: true,
                hidden: !isAdmin,
                // Its dialog asks first.
                onSelect: () => onDelete(phase),
              },
            ]
            return (
              <ContextTarget
                key={phase.id}
                type="project-phase"
                id={phase.id}
                label={phase.name}
                suppress={["button"]}
                items={phaseItems}
              >
                <li
                  data-slot="project-phase"
                  data-selected={selected || undefined}
                  className={cn(
                    surfaceClassName,
                    "group/phase relative flex min-w-0 flex-col gap-3 p-3.5 transition-colors",
                    // The picked phase: a faint grey fill, the usual border.
                    selected ? "bg-muted" : "hover:bg-accent",
                  )}
                >
                  <button
                    type="button"
                    aria-label={phase.name}
                    aria-current={selected ? "step" : undefined}
                    onClick={() => onSelect(phase.id)}
                    className="focus-visible:ring-focus-ring rounded-card absolute inset-0 outline-none focus-visible:ring-2"
                  />
                  {/* 1. Marker and name; ⋯ keeps its place on the right. */}
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "text-micro flex size-5 shrink-0 items-center justify-center rounded-full font-medium tabular-nums",
                        isDone
                          ? "bg-success text-white"
                          : isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isDone ? <RiCheckLine className="size-3" /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm font-medium",
                        isDone || isActive || selected
                          ? "text-foreground"
                          : "text-muted-foreground group-hover/phase:text-foreground",
                      )}
                      title={phase.name}
                    >
                      {phase.name}
                    </span>
                    {isAdmin && <span className="size-6 shrink-0" />}
                  </span>
                  {/* 2. Status, and the due date (red when overdue). */}
                  <span className="text-meta flex min-w-0 items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-muted-foreground truncate",
                        isActive && "text-primary",
                        lateBy > 0 && "text-warning-ink",
                      )}
                      title={dueTitle ?? status}
                    >
                      {status}
                    </span>
                    {due && !isDone && (
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1 tabular-nums",
                          overdue
                            ? "text-destructive-ink font-medium"
                            : "text-tertiary-foreground",
                        )}
                        title={
                          dueTitle ?? t("phaseDue", { date: shortDay(due) })
                        }
                      >
                        <RiCalendarScheduleLine className="size-3.5" />
                        {shortDay(due)}
                      </span>
                    )}
                  </span>
                  {/* 3. Its steps: the bar and the count. */}
                  <span className="flex items-center gap-2.5">
                    <span className="bg-muted relative h-1.5 flex-1 overflow-hidden rounded-full">
                      <span
                        className={cn(
                          "bar-grow absolute inset-y-0 left-0 rounded-full",
                          isDone ? "bg-success" : "bg-primary",
                        )}
                        style={{ "--bar": `${fill}%` } as React.CSSProperties}
                      />
                    </span>
                    <span className="text-tertiary-foreground shrink-0 text-xs tabular-nums">
                      {phaseSteps.length
                        ? t("phaseStepsDone", {
                            done: doneSteps,
                            total: phaseSteps.length,
                          })
                        : t("phaseNoSteps")}
                    </span>
                  </span>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={t("phaseActions")}
                            className="text-muted-foreground absolute top-3.5 right-3 opacity-0 group-hover/phase:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100"
                          />
                        }
                      >
                        <RiMoreFill />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-44">
                        {isActive && onComplete && (
                          <>
                            <DropdownMenuItem onClick={onComplete}>
                              <RiCheckLine />
                              {t("completePhase", { name: clip(phase.name) })}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {phase.status !== "active" && (
                          <DropdownMenuItem onClick={() => onActivate(phase)}>
                            {t("makeActive")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onRename(phase)}>
                          {t("renamePhase")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSettings(phase)}>
                          {t("phaseSettings")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={i === 0}
                          onClick={() => onMove(phase, -1)}
                        >
                          {t("movePhaseLeft")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={i === phases.length - 1}
                          onClick={() => onMove(phase, 1)}
                        >
                          {t("movePhaseRight")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDelete(phase)}
                        >
                          {t("deletePhase")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </li>
              </ContextTarget>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
