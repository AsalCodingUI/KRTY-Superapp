"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  RiAddLine,
  RiCalendarLine,
  RiListCheck2,
  RiMessage3Line,
} from "@/shared/ui/lucide-icons"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type CollisionDetection,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { differenceInCalendarDays, isToday } from "date-fns"
import { GripHorizontal, TriangleAlert } from "lucide-react"
import { m, useReducedMotion } from "motion/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { TaskRow, TeamMember } from "./data"
import type { ProjectStatus } from "../../lib/status"
import { ProjectAvatar } from "@/components/project-avatar"
import { ProjectStatusIcon } from "../ProjectStatusIcon"
import {
  STATUS_LABEL,
  TASK_STATUSES,
  byPosition,
  statusOf,
  type TaskStatus,
} from "./task-data"
import { dueLabel } from "./task-utils"

type Columns = Record<TaskStatus, string[]>

const EASE = [0.23, 1, 0.32, 1] as const

const DROP_ANIMATION: DropAnimation = {
  duration: 220,
  easing: "cubic-bezier(0.23, 1, 0.32, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
}

/** Each column maps onto the projects board's step icon. */
const STATUS_ICON: Record<TaskStatus, ProjectStatus> = {
  todo: "Planned",
  in_progress: "Active",
  review: "Review",
  done: "Completed",
}

/** Same icons as the projects board (dashed, half, open ring, check). */
export function StatusDot({
  status,
  className,
}: {
  status: TaskStatus
  className?: string
}) {
  return (
    <ProjectStatusIcon status={STATUS_ICON[status]} className={className} />
  )
}

function group(tasks: TaskRow[]): Columns {
  const cols: Columns = { todo: [], in_progress: [], review: [], done: [] }
  for (const task of [...tasks].sort(byPosition))
    cols[statusOf(task)].push(task.id)
  return cols
}

function columnOf(cols: Columns, id: string): TaskStatus | null {
  if ((TASK_STATUSES as readonly string[]).includes(id)) return id as TaskStatus
  return TASK_STATUSES.find((s) => cols[s].includes(id)) ?? null
}

/**
 * Trello-style board: four columns, cards dragged between and within them.
 * While dragging, the order lives here; on drop the parent saves it and the
 * override stays until the (optimistically patched) task list catches up.
 */
export function TaskBoard({
  tasks,
  subsOf,
  commentCounts,
  team,
  addSignal,
  onOpen,
  onMove,
  onCreate,
  projectOf,
}: {
  /** Top-level tasks only (already filtered). */
  tasks: TaskRow[]
  subsOf: Map<string, TaskRow[]>
  commentCounts: Record<string, number>
  team: TeamMember[]
  /** Bumped by the page's "New task" button: opens the To do composer. */
  addSignal: number
  onOpen: (task: TaskRow) => void
  /** Saves `id` into `status`, given that column's order after the drop. */
  onMove: (id: string, status: TaskStatus, order: string[]) => void
  /** Without it the columns have no "add card" composer (e.g. Tugas saya,
   *  where a new card wouldn't know its project). */
  onCreate?: (title: string, status: TaskStatus) => Promise<boolean>
  /** Cross-project boards: the card shows its project instead of the PIC. */
  projectOf?: (task: TaskRow) => { id: string; name: string } | undefined
}) {
  const base = useMemo(() => group(tasks), [tasks])
  const [override, setOverride] = useState<Columns | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const cols = override ?? base
  // Cards slide into place only when the saved order changes (a status set
  // in the dialog, someone else's move), never mid-drag: there dnd-kit moves
  // them and the two would fight.
  const layoutKey = useMemo(
    () => TASK_STATUSES.map((s) => base[s].join()).join("|"),
    [base],
  )
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])

  // The column under the pointer wins, then the nearest card in it. Plain
  // closestCorners measures to a column's far corners, so a tall column
  // next to an empty one kept the card and the drop went nowhere.
  const colsRef = useRef(cols)
  colsRef.current = cols
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const column = pointerWithin(args)
      .map((hit) => String(hit.id))
      .find((id) => (TASK_STATUSES as readonly string[]).includes(id))
    if (!column) return closestCorners(args)
    const ids = colsRef.current[column as TaskStatus]
    const cards = args.droppableContainers.filter((c) =>
      ids.includes(String(c.id)),
    )
    // Below the last card (or an empty column): the end of the column.
    const bottom = Math.max(
      ...cards.map((c) => args.droppableRects.get(c.id)?.bottom ?? 0),
    )
    const y = args.pointerCoordinates?.y ?? 0
    if (!cards.length || y > bottom) return [{ id: column }]
    return closestCorners({ ...args, droppableContainers: cards })
  }, [])

  // A drop keeps its order until the task list reflects it.
  const settling = useRef(false)
  useEffect(() => {
    if (settling.current) {
      settling.current = false
      setOverride(null)
    }
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter opens the card; Space picks it up.
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  )

  // The pointer-up that ends a drag also clicks the card; don't open it.
  const lastDrop = useRef(0)
  const open = (task: TaskRow) => {
    if (performance.now() - lastDrop.current > 250) onOpen(task)
  }

  // The lifted card leans into a sideways move (like the projects board).
  const [tilt, setTilt] = useState(0)
  const lastMove = useRef<{ x: number; t: number } | null>(null)
  const settle = useRef<number | undefined>(undefined)
  const onDragMove = ({ delta }: DragMoveEvent) => {
    const now = performance.now()
    const last = lastMove.current
    lastMove.current = { x: delta.x, t: now }
    if (!last || now === last.t) return
    const speed = (delta.x - last.x) / (now - last.t)
    setTilt(Math.max(-TILT_MAX, Math.min(TILT_MAX, speed * TILT_PER_SPEED)))
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => setTilt(0), 90)
  }
  const resetTilt = () => {
    window.clearTimeout(settle.current)
    lastMove.current = null
    setTilt(0)
  }

  const onDragStart = ({ active }: DragStartEvent) => {
    resetTilt()
    setOverride(base)
    setActiveId(String(active.id))
  }

  // Crossing into another column moves the card there right away, so the
  // target column opens a gap where it will land.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    setOverride((current) => {
      const c = current ?? base
      const from = columnOf(c, String(active.id))
      const to = columnOf(c, String(over.id))
      if (!from || !to || from === to) return c
      const target = c[to]
      const overIndex = target.indexOf(String(over.id))
      const index = overIndex < 0 ? target.length : overIndex
      return {
        ...c,
        [from]: c[from].filter((id) => id !== active.id),
        [to]: [
          ...target.slice(0, index),
          String(active.id),
          ...target.slice(index),
        ],
      }
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    resetTilt()
    lastDrop.current = performance.now()
    setActiveId(null)
    const id = String(active.id)
    const c = override ?? base
    const col = columnOf(c, id)
    if (!over || !col) {
      setOverride(null)
      return
    }
    let order = c[col]
    const overIndex = order.indexOf(String(over.id))
    const from = order.indexOf(id)
    if (overIndex >= 0 && overIndex !== from)
      order = arrayMove(order, from, overIndex)
    const task = byId.get(id)
    const unchanged =
      task && statusOf(task) === col && base[col].join() === order.join()
    if (unchanged) {
      setOverride(null)
      return
    }
    setOverride({ ...c, [col]: order })
    settling.current = true
    onMove(id, col, order)
  }

  const active = activeId ? byId.get(activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        resetTilt()
        setActiveId(null)
        setOverride(null)
      }}
    >
      <div className="bleed gutter-x flex gap-3 overflow-x-auto pt-4 pb-6">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            ids={cols[status]}
            byId={byId}
            layoutKey={layoutKey}
            addSignal={status === "todo" ? addSignal : 0}
            renderCard={(task) => (
              <TaskCard
                task={task}
                subtasks={subsOf.get(task.id) ?? []}
                comments={commentCounts[task.id] ?? 0}
                team={team}
                project={projectOf?.(task)}
              />
            )}
            onOpen={open}
            onCreate={onCreate && ((title) => onCreate(title, status))}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={DROP_ANIMATION}>
        {active ? (
          <LiftedCard tilt={tilt}>
            <TaskCard
              task={active}
              subtasks={subsOf.get(active.id) ?? []}
              comments={commentCounts[active.id] ?? 0}
              team={team}
              project={projectOf?.(active)}
              lifted
            />
          </LiftedCard>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function Column({
  status,
  ids,
  byId,
  layoutKey,
  addSignal,
  renderCard,
  onOpen,
  onCreate,
}: {
  status: TaskStatus
  ids: string[]
  byId: Map<string, TaskRow>
  layoutKey: string
  addSignal: number
  renderCard: (task: TaskRow) => React.ReactNode
  onOpen: (task: TaskRow) => void
  onCreate?: (title: string) => Promise<boolean>
}) {
  const t = useT("projects")
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState("")
  useEffect(() => {
    if (addSignal) setAdding(true)
  }, [addSignal])

  // One card per Enter, even when it's pressed again before the save lands.
  const busy = useRef(false)
  const add = async () => {
    if (busy.current || !title.trim() || !onCreate) return
    busy.current = true
    const ok = await onCreate(title)
    busy.current = false
    if (ok) setTitle("")
  }

  return (
    <section
      ref={setNodeRef}
      aria-label={t(STATUS_LABEL[status])}
      className={cn(
        // Same as the projects board: no fill, a dashed outline while a
        // card hovers it (inside the box so the scroller never clips it).
        "nest-rounded-2xl nest-p-2 flex min-h-64 min-w-60 flex-1 flex-col gap-2 border border-dashed border-transparent transition-colors",
        isOver && "border-foreground/20 bg-foreground/[0.02]",
      )}
    >
      <header className="flex items-center gap-2 px-1.5 pt-0.5 pb-1 text-sm">
        <StatusDot status={status} />
        <span className="text-foreground/90">{t(STATUS_LABEL[status])}</span>
        <span className="text-muted-foreground tabular-nums">{ids.length}</span>
      </header>

      {/* Adding happens at the top, where the new card lands. */}
      {!onCreate ? null : adding ? (
        <div className="flex flex-col gap-1.5">
          <Input
            autoFocus
            value={title}
            placeholder={t("cardPlaceholder")}
            aria-label={t("addCard")}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add()
              if (e.key === "Escape") {
                setAdding(false)
                setTitle("")
              }
            }}
            onBlur={() => {
              if (!title.trim()) setAdding(false)
            }}
            className="h-9 text-[13px]"
          />
        </div>
      ) : (
        <Button
          variant="ghost"
          onClick={() => setAdding(true)}
          className="text-muted-foreground justify-start text-[13px] font-normal"
        >
          <RiAddLine data-icon="inline-start" />
          {t("addCard")}
        </Button>
      )}

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-10 flex-col gap-2">
          {ids.map((id) => {
            const task = byId.get(id)
            return task ? (
              <SortableCard
                key={id}
                task={task}
                layoutKey={layoutKey}
                onOpen={() => onOpen(task)}
              >
                {renderCard(task)}
              </SortableCard>
            ) : null
          })}
          {ids.length === 0 && !adding && (
            <p className="text-muted-foreground px-1.5 py-4 text-center text-sm">
              {t("columnEmpty")}
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  )
}

function SortableCard({
  task,
  layoutKey,
  onOpen,
  children,
}: {
  task: TaskRow
  layoutKey: string
  onOpen: () => void
  children: React.ReactNode
}) {
  const reduce = useReducedMotion()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  return (
    // Outer layer: motion slides the card when the saved order changes.
    // dnd-kit moves the inner layer while dragging.
    <m.div
      layout={reduce ? false : "position"}
      layoutDependency={layoutKey}
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        style={{
          transform: CSS.Translate.toString(transform),
          transition,
        }}
        onClick={onOpen}
        onKeyDown={(e) => {
          listeners?.onKeyDown?.(e)
          if (e.key === "Enter") onOpen()
        }}
        className={cn(
          "group/card rounded-nested focus-visible:ring-primary/40 relative cursor-grab outline-none focus-visible:ring-2 active:cursor-grabbing",
          // The spot it left, until it's dropped.
          isDragging && "opacity-40",
        )}
      >
        {children}
      </div>
    </m.div>
  )
}

/** Degrees the lifted card leans per px/ms of sideways speed, and the cap. */
const TILT_PER_SPEED = 6
const TILT_MAX = 8

/**
 * The card under the pointer: it lifts (a little bigger, paper shadow) and
 * leans into a sideways move like a real card, settling when you stop.
 */
function LiftedCard({
  tilt,
  children,
}: {
  tilt: number
  children: React.ReactNode
}) {
  const [lifted, setLifted] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLifted(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <div
      className="cursor-grabbing transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform [--nest-p:calc(var(--spacing)*2)] [--nest-r:var(--radius-2xl)] motion-reduce:transition-none"
      style={{
        transform: `rotate(${tilt}deg) scale(${lifted ? 1.03 : 1})`,
      }}
    >
      {children}
    </div>
  )
}

function TaskCard({
  task,
  subtasks,
  comments,
  team,
  project,
  lifted,
}: {
  task: TaskRow
  subtasks: TaskRow[]
  comments: number
  team: TeamMember[]
  project?: { id: string; name: string }
  lifted?: boolean
}) {
  const t = useT("projects")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const assignee = team.find((m) => m.id === task.assignee_id)
  const doneSubs = subtasks.filter((s) => s.done).length
  const due = task.due_date ? new Date(`${task.due_date}T00:00:00`) : null
  const overdue =
    due && !task.done && differenceInCalendarDays(due, new Date()) < 0

  const dueText = due
    ? dueLabel(task.due_date!, dateLocale, {
        today: tc("today"),
        tomorrow: t("tomorrow"),
      })
    : null

  // Same card as the projects board: meta line, title, people row.
  return (
    <div
      className={cn(
        "bg-card border-border group-hover/card:border-foreground/20 rounded-nested relative flex flex-col gap-1.5 border px-3.5 py-3 text-sm transition-[border-color,box-shadow] duration-200",
        lifted && "border-transparent shadow-(--elev-4)",
      )}
    >
      {/* Hover hint that the card can be picked up. */}
      {!lifted && (
        <GripHorizontal
          aria-hidden="true"
          className="text-muted-foreground/70 absolute top-0.5 left-1/2 size-3.5 -translate-x-1/2 opacity-0 transition-opacity group-hover/card:opacity-100"
        />
      )}
      {(dueText || subtasks.length > 0 || comments > 0) && (
        <div className="text-muted-foreground flex items-center gap-2.5 text-xs tabular-nums">
          {dueText && (
            <span
              className={cn(
                "flex min-w-0 items-center gap-1 truncate",
                isToday(due!) && !task.done && "text-warning",
              )}
            >
              <RiCalendarLine className="size-3.5 shrink-0" />
              {dueText}
            </span>
          )}
          {subtasks.length > 0 && (
            <span
              className={cn(
                "flex items-center gap-1",
                doneSubs === subtasks.length && "text-success-ink",
              )}
              aria-label={t("subtaskProgress", {
                done: doneSubs,
                total: subtasks.length,
              })}
            >
              <RiListCheck2 className="size-3.5" />
              {doneSubs}/{subtasks.length}
            </span>
          )}
          {comments > 0 && (
            <span
              className="flex items-center gap-1"
              aria-label={t("commentCount", { n: comments })}
            >
              <RiMessage3Line className="size-3.5" />
              {comments}
            </span>
          )}
          {overdue && (
            <TriangleAlert
              aria-label={t("kanbanOverdue")}
              className="text-warning ml-auto size-3.5 shrink-0"
            />
          )}
        </div>
      )}
      <p className="text-foreground line-clamp-3 break-words">{task.title}</p>
      {project ? (
        <div className="flex items-center gap-1.5 pt-0.5">
          <ProjectAvatar
            id={project.id}
            name={project.name}
            className="size-4 rounded-[4px]"
          />
          <span className="text-muted-foreground truncate text-xs">
            {project.name}
          </span>
        </div>
      ) : (
        assignee && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <Avatar className="size-5" title={assignee.full_name ?? ""}>
              <AvatarImage src={assignee.avatar_url || undefined} alt="" />
              <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-medium">
                {(assignee.full_name || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground truncate text-xs">
              {assignee.full_name}
            </span>
          </div>
        )
      )}
    </div>
  )
}
