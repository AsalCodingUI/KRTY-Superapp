"use client"

import { PageHeader } from "@/components/page-header"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { EmptyState } from "@/components/empty-state"
import { EmptyValue } from "@/components/empty-value"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  RiCheckboxCircleLine,
  RiDeleteBinLine,
} from "@/shared/ui/lucide-icons"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  differenceInCalendarDays,
  format,
  isToday,
  isTomorrow,
  type Locale,
} from "date-fns"
import { useMemo, useState } from "react"
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

function dueLabel(
  date: string,
  locale: Locale,
  words: { today: string; tomorrow: string },
) {
  const d = new Date(`${date}T00:00:00`)
  if (isToday(d)) return words.today
  if (isTomorrow(d)) return words.tomorrow
  const diff = differenceInCalendarDays(d, new Date())
  if (diff > 1 && diff < 7) return format(d, "EEE", { locale })
  return format(d, "d MMM", { locale })
}

/** Project tasks (DesignerHQ-style table) with inline editing and subtasks. */
export function ProjectTasks({ projectId }: { projectId: string }) {
  const t = useT("projects")
  const tc = useT("common")
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
    if (error) toast.error(t("errSaveTask"))
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
      toast.error(t("errAddTask"))
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
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={t("sectionTasks")}
        actions={
          <Button onClick={() => setAdding(true)}>
            <RiAddLine data-icon="inline-start" />
            {t("newTask")}
          </Button>
        }
      />
      <div className="border-border flex items-end justify-between gap-3 border-b">
        <TabNavigation className="border-b-0">
          {(
            [
              ["all", tc("all")],
              ["todo", t("filterTodo")],
              ["done", t("statusCompleted")],
            ] as const
          ).map(([key, label]) => (
            <TabNavigationLink
              key={key}
              active={filter === key}
              onClick={() => setFilter(key)}
              showLeadingIcon={false}
            >
              {label}
              {counts[key] > 0 && (
                <span className="text-tertiary-foreground ml-1.5 tabular-nums">
                  {counts[key]}
                </span>
              )}
            </TabNavigationLink>
          ))}
        </TabNavigation>
        <Button
          size="sm"
          variant="outline"
          className={cn("mb-2", mine && "bg-muted text-foreground")}
          aria-pressed={mine}
          onClick={() => setMine((v) => !v)}
        >
          {t("filterMine")}
        </Button>
      </div>
      <div className="flex flex-col gap-4 pb-4">
        <div className="bleed flex flex-col text-sm">
          <div className="text-muted-foreground border-border gutter-x grid grid-cols-[2.5rem_minmax(0,1fr)_8rem_10rem_7rem_5rem] items-center border-b py-2 text-[13px]">
            <span />
            <span>{t("colTask")}</span>
            <span>{t("factsPhase")}</span>
            <span>{t("colPic")}</span>
            <span>{t("factsDeadline")}</span>
            <span className="text-right">{t("colCreated")}</span>
          </div>

          {adding && (
            <div className="border-border/50 gutter-x grid grid-cols-[2.5rem_minmax(0,1fr)] items-center border-b py-2">
              <span />
              <Input
                autoFocus
                value={newTitle}
                placeholder={t("taskPlaceholder")}
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
            <EmptyState
              placement="inner"
              icon={<RiCheckboxCircleLine className="size-5" />}
              title={t("sectionTasks")}
              description={
                filter === "done" ? t("tasksEmptyDone") : t("tasksEmpty")
              }
              action={
                filter === "done"
                  ? undefined
                  : { label: t("newTask"), onClick: () => setAdding(true) }
              }
            />
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
  const t = useT("projects")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [subTitle, setSubTitle] = useState("")
  const [dateOpen, setDateOpen] = useState(false)
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
      <div className="group/task border-border/50 hover:bg-muted/20 gutter-x grid min-h-12 grid-cols-[2.5rem_minmax(0,1fr)_8rem_10rem_7rem_5rem] items-center border-b">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={expanded ? t("collapseSubtasks") : t("expandSubtasks")}
            aria-expanded={expanded}
            onClick={() => onExpand(!expanded)}
            className={cn(
              "text-muted-foreground aria-expanded:text-muted-foreground -ml-6 aria-expanded:bg-transparent",
              subtasks.length === 0 &&
                "invisible group-hover/task:visible focus-visible:visible",
            )}
          >
            <RiArrowRightSLine
              className={cn(
                "size-4! transition-transform",
                expanded && "rotate-90",
              )}
            />
          </Button>
          <Checkbox
            checked={task.done}
            onCheckedChange={() => onToggle(task)}
            aria-label={task.done ? t("markUndone") : t("markDone")}
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
            <span className="text-muted-foreground shrink-0 text-[13px] tabular-nums">
              {doneSubs}/{subtasks.length}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("deleteTask")}
            onClick={() => onRemove(task.id)}
            className="text-muted-foreground hover:text-destructive ml-auto opacity-0 group-hover/task:opacity-100 focus-visible:opacity-100"
          >
            <RiDeleteBinLine />
          </Button>
        </div>
        <Select
          value={task.phase_id ?? NONE}
          onValueChange={(v) =>
            v && onUpdate(task.id, { phase_id: v === NONE ? null : v })
          }
        >
          <SelectTrigger
            size="sm"
            className="text-muted-foreground hover:bg-accent w-[7.5rem] border-transparent bg-transparent px-2.5 text-[13px] shadow-none hover:border-transparent"
          >
            <SelectValue>
              {(v: string) =>
                phases.find((p) => p.id === v)?.name ?? t("noPhase")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("noPhase")}</SelectItem>
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
          <SelectTrigger
            size="sm"
            className="hover:bg-accent w-[9.5rem] border-transparent bg-transparent px-2.5 text-[13px] shadow-none hover:border-transparent"
          >
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
                  <EmptyValue />
                )
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("noPic")}</SelectItem>
            {team.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Due date: the app's calendar in a popover (not the browser's). */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-self-start px-2.5 text-[13px] font-normal",
                  task.due_date
                    ? overdue
                      ? "text-destructive"
                      : isToday(new Date(`${task.due_date}T00:00:00`))
                        ? "text-warning"
                        : "text-foreground"
                    : "text-muted-foreground",
                )}
              />
            }
          >
            <RiCalendarLine data-icon="inline-start" className="size-3.5" />
            {task.due_date ? (
              dueLabel(task.due_date, dateLocale, {
                today: tc("today"),
                tomorrow: t("tomorrow"),
              })
            ) : (
              <EmptyValue />
            )}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={
                task.due_date
                  ? new Date(`${task.due_date}T00:00:00`)
                  : undefined
              }
              defaultMonth={
                task.due_date
                  ? new Date(`${task.due_date}T00:00:00`)
                  : undefined
              }
              locale={dateLocale}
              onSelect={(date) => {
                onUpdate(task.id, {
                  due_date: date ? format(date, "yyyy-MM-dd") : null,
                })
                setDateOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground text-right text-[13px] tabular-nums">
          {format(new Date(task.created_at), "d MMM", { locale: dateLocale })}
        </span>
      </div>

      {expanded && (
        <div className="border-border/50 flex flex-col border-b py-1 pl-[3.75rem]">
          {subtasks.map((sub) => (
            <div
              key={sub.id}
              className="group/sub flex min-h-9 items-center gap-2 pr-4"
            >
              <Checkbox
                checked={sub.done}
                onCheckedChange={() =>
                  onUpdate(sub.id, {
                    done: !sub.done,
                    completed_at: sub.done ? null : new Date().toISOString(),
                  })
                }
                aria-label={sub.done ? t("markUndone") : t("markDone")}
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  sub.done && "text-muted-foreground line-through",
                )}
              >
                {sub.title}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("deleteSubtask")}
                onClick={() => onRemove(sub.id)}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover/sub:opacity-100 focus-visible:opacity-100"
              >
                <RiDeleteBinLine />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2 py-1 pr-4">
            <RiAddLine className="text-muted-foreground size-4 shrink-0" />
            <Input
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && (await onAddSub(subTitle))) {
                  setSubTitle("")
                }
              }}
              placeholder={t("addSubtask")}
              aria-label={t("addSubtask")}
              className="h-8 flex-1"
            />
          </div>
        </div>
      )}
    </>
  )
}
