"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import {
  RiAddLine,
  RiArrowRightSLine,
  RiCalendarLine,
  RiCheckLine,
  RiDeleteBinLine,
} from "@/shared/ui/lucide-icons"
import { differenceInCalendarDays, format, isToday, isTomorrow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  supabase,
  useInvalidate,
  useTasks,
  useViewer,
  useWorkspace,
  type TaskRow,
  type TeamMember,
} from "./data"

type Filter = "all" | "todo" | "done"
const NONE = "__none__"

function dueLabel(date: string) {
  const d = new Date(`${date}T00:00:00`)
  if (isToday(d)) return "Hari ini"
  if (isTomorrow(d)) return "Besok"
  const diff = differenceInCalendarDays(d, new Date())
  if (diff > 1 && diff < 7) return format(d, "EEE", { locale: idLocale })
  return format(d, "d MMM", { locale: idLocale })
}

function Check({
  done,
  onToggle,
  label,
}: {
  done: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-[5px] ring-1 transition-colors",
        done
          ? "bg-primary ring-primary text-primary-foreground"
          : "ring-foreground/25 hover:ring-foreground/50",
      )}
    >
      {done && <RiCheckLine className="size-3" />}
    </button>
  )
}

/** Project tasks (DesignerHQ-style table) with inline editing and subtasks. */
export function ProjectTasks({ projectId }: { projectId: string }) {
  const { data: workspace } = useWorkspace(projectId)
  const { data: tasks = [], isLoading } = useTasks(projectId)
  const viewer = useViewer()
  const invalidate = useInvalidate(projectId)
  const [filter, setFilter] = useState<Filter>("todo")
  const [mine, setMine] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const phases = workspace?.phases ?? []
  const team = workspace?.team ?? []
  const activePhase = phases.find((p) => p.status === "active")

  const top = tasks.filter((t) => !t.parent_id)
  const subsOf = useMemo(() => {
    const map = new Map<string, TaskRow[]>()
    for (const t of tasks) {
      if (!t.parent_id) continue
      map.set(t.parent_id, [...(map.get(t.parent_id) ?? []), t])
    }
    return map
  }, [tasks])

  const counts = {
    all: top.length,
    todo: top.filter((t) => !t.done).length,
    done: top.filter((t) => t.done).length,
  }
  const visible = top
    .filter((t) =>
      filter === "all" ? true : filter === "done" ? t.done : !t.done,
    )
    .filter((t) => !mine || t.assignee_id === viewer.id)
    .sort((a, b) => {
      if (a.done !== b.done) return Number(a.done) - Number(b.done)
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return a.created_at.localeCompare(b.created_at)
    })

  const update = async (id: string, patch: Partial<TaskRow>) => {
    const { error } = await supabase()
      .from("project_tasks")
      .update(patch)
      .eq("id", id)
    if (error) toast.error("Gagal menyimpan tugas.")
    invalidate("tasks")
  }

  const create = async (title: string, parentId: string | null = null) => {
    const value = title.trim()
    if (!value) return false
    const parent = parentId ? tasks.find((t) => t.id === parentId) : null
    const { error } = await supabase()
      .from("project_tasks")
      .insert({
        project_id: projectId,
        title: value,
        parent_id: parentId,
        phase_id: parent?.phase_id ?? activePhase?.id ?? null,
        created_by: viewer.id,
      })
    if (error) {
      toast.error("Gagal menambah tugas.")
      return false
    }
    invalidate("tasks")
    return true
  }

  const remove = async (id: string) => {
    await supabase().from("project_tasks").delete().eq("id", id)
    invalidate("tasks")
  }

  const toggle = (task: TaskRow) =>
    update(task.id, {
      done: !task.done,
      completed_at: task.done ? null : new Date().toISOString(),
    })

  const addTop = async () => {
    if (await create(newTitle)) setNewTitle("")
    else setAdding(false)
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-muted/60 flex items-center gap-0.5 rounded-md p-0.5 text-sm">
            {(
              [
                ["all", "Semua"],
                ["todo", "Belum"],
                ["done", "Selesai"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={cn(
                  "text-muted-foreground hover:text-foreground flex h-7 items-center gap-1.5 rounded-[5px] px-2.5",
                  filter === key && "bg-background text-foreground shadow-xs",
                )}
              >
                {label}
                <span className="text-muted-foreground/80 tabular-nums">
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant={mine ? "secondary" : "ghost"}
            aria-pressed={mine}
            onClick={() => setMine((v) => !v)}
          >
            Punya saya
          </Button>
        </div>
        <Button onClick={() => setAdding(true)}>
          <RiAddLine data-icon="inline-start" />
          Tugas baru
        </Button>
      </div>

      <div className="-mx-4 flex flex-col text-sm">
        <div className="text-muted-foreground border-border grid grid-cols-[2.5rem_minmax(0,1fr)_8rem_10rem_7rem_5rem] items-center border-b px-4 py-2 text-xs">
          <span />
          <span>Tugas</span>
          <span>Phase</span>
          <span>PIC</span>
          <span>Deadline</span>
          <span className="text-right">Dibuat</span>
        </div>

        {adding && (
          <div className="border-border/50 grid grid-cols-[2.5rem_minmax(0,1fr)] items-center border-b px-4 py-2">
            <span />
            <Input
              autoFocus
              value={newTitle}
              placeholder="Nama tugas, Enter untuk simpan"
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTop()
                if (e.key === "Escape") {
                  setAdding(false)
                  setNewTitle("")
                }
              }}
              onBlur={() => {
                if (!newTitle.trim()) setAdding(false)
              }}
              className="h-8"
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-6" />
          </div>
        ) : visible.length === 0 && !adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-muted-foreground hover:text-foreground py-12 text-center"
          >
            {filter === "done"
              ? "Belum ada tugas yang selesai."
              : "Belum ada tugas. Tambah tugas pertama."}
          </button>
        ) : (
          visible.map((task) => (
            <TaskRows
              key={task.id}
              task={task}
              subtasks={subsOf.get(task.id) ?? []}
              expanded={Boolean(expanded[task.id])}
              onExpand={(open) =>
                setExpanded((e) => ({ ...e, [task.id]: open }))
              }
              phases={phases}
              team={team}
              onUpdate={update}
              onToggle={toggle}
              onRemove={remove}
              onAddSub={(title) => create(title, task.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TaskRows({
  task,
  subtasks,
  expanded,
  onExpand,
  phases,
  team,
  onUpdate,
  onToggle,
  onRemove,
  onAddSub,
}: {
  task: TaskRow
  subtasks: TaskRow[]
  expanded: boolean
  onExpand: (open: boolean) => void
  phases: { id: string; name: string }[]
  team: TeamMember[]
  onUpdate: (id: string, patch: Partial<TaskRow>) => void
  onToggle: (task: TaskRow) => void
  onRemove: (id: string) => void
  onAddSub: (title: string) => Promise<boolean>
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [subTitle, setSubTitle] = useState("")
  const dateRef = useRef<HTMLInputElement>(null)
  const assignee = team.find((m) => m.id === task.assignee_id)
  const doneSubs = subtasks.filter((s) => s.done).length
  const overdue =
    task.due_date &&
    !task.done &&
    differenceInCalendarDays(
      new Date(`${task.due_date}T00:00:00`),
      new Date(),
    ) < 0

  const saveTitle = () => {
    setEditing(false)
    if (title.trim() && title.trim() !== task.title) {
      onUpdate(task.id, { title: title.trim() })
    } else setTitle(task.title)
  }

  return (
    <>
      <div className="group/task border-border/50 hover:bg-muted/20 grid min-h-11 grid-cols-[2.5rem_minmax(0,1fr)_8rem_10rem_7rem_5rem] items-center border-b px-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={expanded ? "Tutup subtugas" : "Buka subtugas"}
            onClick={() => onExpand(!expanded)}
            className={cn(
              "text-muted-foreground -ml-4 w-4",
              subtasks.length === 0 && "invisible group-hover/task:visible",
            )}
          >
            <RiArrowRightSLine
              className={cn(
                "size-4 transition-transform",
                expanded && "rotate-90",
              )}
            />
          </button>
          <Check
            done={task.done}
            onToggle={() => onToggle(task)}
            label={task.done ? "Tandai belum selesai" : "Tandai selesai"}
          />
        </div>
        <div className="flex min-w-0 items-center gap-2 pr-3">
          {editing ? (
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle()
                if (e.key === "Escape") {
                  setTitle(task.title)
                  setEditing(false)
                }
              }}
              className="h-7"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={cn(
                "min-w-0 truncate text-left",
                task.done && "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </button>
          )}
          {subtasks.length > 0 && (
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {doneSubs}/{subtasks.length}
            </span>
          )}
          <button
            type="button"
            aria-label="Hapus tugas"
            onClick={() => onRemove(task.id)}
            className="text-muted-foreground hover:text-destructive ml-auto hidden shrink-0 group-hover/task:block"
          >
            <RiDeleteBinLine className="size-4" />
          </button>
        </div>
        <Select
          value={task.phase_id ?? NONE}
          onValueChange={(v) =>
            v && onUpdate(task.id, { phase_id: v === NONE ? null : v })
          }
        >
          <SelectTrigger className="text-muted-foreground hover:bg-muted/50 h-7 w-[7.5rem] border-0 bg-transparent px-2 text-xs shadow-none">
            <SelectValue>
              {(v: string) =>
                phases.find((p) => p.id === v)?.name ?? "Tanpa phase"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Tanpa phase</SelectItem>
            {phases.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={task.assignee_id ?? NONE}
          onValueChange={(v) =>
            v && onUpdate(task.id, { assignee_id: v === NONE ? null : v })
          }
        >
          <SelectTrigger className="hover:bg-muted/50 h-7 w-[9.5rem] border-0 bg-transparent px-2 text-xs shadow-none">
            <SelectValue>
              {() =>
                assignee ? (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Avatar className="size-5">
                      <AvatarImage
                        src={assignee.avatar_url || undefined}
                        alt=""
                      />
                      <AvatarFallback className="text-[9px]">
                        {(assignee.full_name || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">
                      {assignee.full_name?.split(" ")[0]}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Tanpa PIC</SelectItem>
            {team.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <button
            type="button"
            onClick={() => dateRef.current?.showPicker?.()}
            className={cn(
              "hover:bg-muted/50 flex h-7 items-center gap-1.5 rounded-md px-2 text-xs",
              task.due_date
                ? overdue
                  ? "text-destructive"
                  : isToday(new Date(`${task.due_date}T00:00:00`))
                    ? "text-warning"
                    : "text-foreground"
                : "text-muted-foreground",
            )}
          >
            <RiCalendarLine className="size-3.5" />
            {task.due_date ? dueLabel(task.due_date) : "—"}
          </button>
          <input
            ref={dateRef}
            type="date"
            tabIndex={-1}
            aria-hidden
            value={task.due_date ?? ""}
            onChange={(e) =>
              onUpdate(task.id, { due_date: e.target.value || null })
            }
            className="pointer-events-none absolute inset-0 opacity-0"
          />
        </div>
        <span className="text-muted-foreground text-right text-xs tabular-nums">
          {format(new Date(task.created_at), "d MMM", { locale: idLocale })}
        </span>
      </div>

      {expanded && (
        <div className="border-border/50 flex flex-col border-b py-1 pl-[3.75rem]">
          {subtasks.map((sub) => (
            <div
              key={sub.id}
              className="group/sub flex min-h-9 items-center gap-2 pr-4"
            >
              <Check
                done={sub.done}
                onToggle={() =>
                  onUpdate(sub.id, {
                    done: !sub.done,
                    completed_at: sub.done ? null : new Date().toISOString(),
                  })
                }
                label={sub.done ? "Tandai belum selesai" : "Tandai selesai"}
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  sub.done && "text-muted-foreground line-through",
                )}
              >
                {sub.title}
              </span>
              <button
                type="button"
                aria-label="Hapus subtugas"
                onClick={() => onRemove(sub.id)}
                className="text-muted-foreground hover:text-destructive hidden group-hover/sub:block"
              >
                <RiDeleteBinLine className="size-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2 py-1 pr-4">
            <RiAddLine className="text-muted-foreground size-4" />
            <input
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && (await onAddSub(subTitle))) {
                  setSubTitle("")
                }
              }}
              placeholder="Tambah subtugas"
              className="placeholder:text-muted-foreground h-8 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      )}
    </>
  )
}
