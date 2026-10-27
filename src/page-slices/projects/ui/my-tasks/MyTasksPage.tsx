"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import { projectHref } from "@/shared/lib/url-params"
import { EmptyState } from "@/components/empty-state"
import { EmptyValue } from "@/components/empty-value"
import { PageHeader } from "@/components/page-header"
import { ProjectAvatar } from "@/components/project-avatar"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ViewToggle, useViewMode } from "@/components/view-toggle"
import { cn } from "@/lib/utils"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiCheckboxCircleLine, RiMessage3Line } from "@/shared/ui/lucide-icons"
import { differenceInCalendarDays, isToday } from "date-fns"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { supabase, useViewer, type TaskRow } from "../workspace/data"
import { StatusDot, TaskBoard } from "../workspace/TaskBoard"
import { TaskDialog } from "../workspace/TaskDialog"
import {
  STATUS_LABEL,
  byPosition,
  positionBetween,
  topPosition,
  statusOf,
  statusPatch,
  type TaskStatus,
} from "../workspace/task-data"
import { dueLabel } from "../workspace/task-utils"
import {
  useMyCommentCounts,
  useMyTaskWriter,
  useMyTasks,
  type MyProject,
} from "./my-tasks-data"

type Filter = "all" | "todo" | "done"
const ALL = "__all__"

const ROW_GRID =
  "grid grid-cols-[2.5rem_minmax(0,1fr)_5rem] items-center md:grid-cols-[2.5rem_minmax(0,1fr)_12rem_9rem_7rem]"

/**
 * Tugas saya: every task assigned to the viewer, across their running
 * projects. Same board and dialog as a project's Tugas page; new tasks are
 * still added inside a project.
 */
export function MyTasksPage() {
  const t = useT("projects")
  const tc = useT("common")
  const viewer = useViewer()
  const { data, isLoading } = useMyTasks(viewer.id)
  const writer = useMyTaskWriter(viewer.id, () => toast.error(t("errSaveTask")))
  const [view, setView] = useViewMode("my-tasks", "kanban")
  // Phones always get the list: a board doesn't fit.
  const isMobile = useIsMobile()
  const board = view !== "list" && !isMobile
  const [filter, setFilter] = useState<Filter>("todo")
  const [projectFilter, setProjectFilter] = useState<string>(ALL)
  const [openId, setOpenId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const projects = useMemo(
    () =>
      Object.values(data?.projects ?? {}).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [data],
  )
  const commentCounts = useMyCommentCounts(projects.map((p) => p.id))

  const allTasks = useMemo(() => data?.tasks ?? [], [data])
  const subtasks = useMemo(() => data?.subtasks ?? [], [data])
  const everything = useMemo(
    () => [...allTasks, ...subtasks],
    [allTasks, subtasks],
  )
  const subsOf = useMemo(() => {
    const map = new Map<string, TaskRow[]>()
    for (const s of [...subtasks].sort(byPosition)) {
      if (!s.parent_id) continue
      map.set(s.parent_id, [...(map.get(s.parent_id) ?? []), s])
    }
    return map
  }, [subtasks])

  const scoped = useMemo(
    () =>
      projectFilter === ALL
        ? allTasks
        : allTasks.filter((task) => task.project_id === projectFilter),
    [allTasks, projectFilter],
  )
  const counts = {
    all: scoped.length,
    todo: scoped.filter((task) => !task.done).length,
    done: scoped.filter((task) => task.done).length,
  }
  const visible = scoped
    .filter((task) =>
      filter === "all" ? true : filter === "done" ? task.done : !task.done,
    )
    .sort((a, b) => {
      if (a.done !== b.done) return Number(a.done) - Number(b.done)
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return a.created_at.localeCompare(b.created_at)
    })

  const projectOf = (task: TaskRow): MyProject | undefined =>
    data?.projects[task.project_id]

  /** Bottom of `status` within the task's own project. */
  const lastPosition = (task: TaskRow, status: TaskStatus) =>
    everything
      .filter(
        (row) =>
          row.project_id === task.project_id &&
          row.parent_id === task.parent_id &&
          row.id !== task.id &&
          statusOf(row) === status,
      )
      .reduce<
        number | null
      >((max, row) => (row.position !== null && (max === null || row.position > max) ? row.position : max), null)

  const setStatus = (task: TaskRow, status: TaskStatus) => {
    if (statusOf(task) === status) return
    writer.patch(task.id, {
      ...statusPatch(task, status),
      position: positionBetween(lastPosition(task, status), null),
    })
  }

  // A card dropped on the board: keep its spot between the neighbours, or
  // send it to the end of the column in its project when there's no room.
  const move = (id: string, status: TaskStatus, order: string[]) => {
    const task = allTasks.find((row) => row.id === id)
    if (!task) return
    const byId = new Map(allTasks.map((row) => [row.id, row]))
    const index = order.indexOf(id)
    const prev = byId.get(order[index - 1])?.position ?? null
    const next = byId.get(order[index + 1])?.position ?? null
    const position =
      (index > 0 && prev === null) ||
      (index < order.length - 1 && next === null)
        ? null
        : positionBetween(prev, next)
    writer.patch(id, {
      ...statusPatch(task, status),
      position: position ?? positionBetween(lastPosition(task, status), null),
    })
  }

  const addSubtask = async (title: string, parentId: string) => {
    const value = title.trim()
    const parent = allTasks.find((row) => row.id === parentId)
    if (!value || !parent) return false
    const { error } = await supabase()
      .from("project_tasks")
      .insert({
        project_id: parent.project_id,
        title: value,
        parent_id: parentId,
        status: "todo",
        position: topPosition(subtasks, parentId),
        phase_id: parent.phase_id,
        created_by: viewer.id,
      })
    if (error) {
      toast.error(t("errAddTask"))
      return false
    }
    await writer.refresh([parent.project_id])
    return true
  }

  const remove = async (id: string) => {
    if (id === openId) setDialogOpen(false)
    const row = everything.find((r) => r.id === id)
    const { error } = await supabase()
      .from("project_tasks")
      .delete()
      .eq("id", id)
    if (error) toast.error(t("errDeleteTask"))
    writer.refresh(row ? [row.project_id] : [])
  }

  const openTask = (id: string) => {
    setOpenId(id)
    setDialogOpen(true)
  }
  const openRow = openId ? allTasks.find((row) => row.id === openId) : null

  const empty = !isLoading && allTasks.length === 0

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={t("myTasksTitle")}
        actions={
          !empty && (
            <>
              <Select
                value={projectFilter}
                onValueChange={(v) => v && setProjectFilter(v)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue>
                    {(v: string) =>
                      v === ALL
                        ? t("myTasksAllProjects")
                        : (data?.projects[v]?.name ?? t("myTasksAllProjects"))
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("myTasksAllProjects")}</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isMobile && (
                <ViewToggle
                  value={board ? "kanban" : "list"}
                  onValueChange={setView}
                  modes={["kanban", "list"]}
                />
              )}
            </>
          )
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6" />
        </div>
      ) : empty ? (
        <EmptyState
          icon={<RiCheckboxCircleLine className="size-5" />}
          title={t("myTasksEmpty")}
          description={t("myTasksEmptyDesc")}
        />
      ) : board ? (
        <div className="border-border border-t">
          <TaskBoard
            tasks={scoped}
            subsOf={subsOf}
            commentCounts={commentCounts}
            team={[]}
            addSignal={0}
            onOpen={(task) => openTask(task.id)}
            onMove={move}
            projectOf={projectOf}
          />
        </div>
      ) : (
        <>
          <div className="border-border border-b">
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
          </div>
          <div className="bleed flex flex-col pb-4 text-sm">
            <div
              className={cn(
                ROW_GRID,
                "text-muted-foreground border-border gutter-x border-b py-2 text-[13px]",
              )}
            >
              <span />
              <span>{t("colTask")}</span>
              <span className="hidden md:block">{t("colProject")}</span>
              <span className="hidden md:block">{t("colStatus")}</span>
              <span>{t("factsDeadline")}</span>
            </div>
            {visible.length === 0 ? (
              <EmptyState
                placement="inner"
                icon={<RiCheckboxCircleLine className="size-5" />}
                title={
                  filter === "done"
                    ? t("tasksEmptyDone")
                    : t("myTasksEmptyTodo")
                }
              />
            ) : (
              visible.map((task) => (
                <MyTaskRow
                  key={task.id}
                  task={task}
                  project={projectOf(task)}
                  subtasks={subsOf.get(task.id) ?? []}
                  comments={commentCounts[task.id] ?? 0}
                  onToggle={() => setStatus(task, task.done ? "todo" : "done")}
                  onOpen={() => openTask(task.id)}
                />
              ))
            )}
          </div>
        </>
      )}

      <TaskDialog
        task={openRow ?? null}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={openRow?.project_id ?? ""}
        subtasks={openRow ? (subsOf.get(openRow.id) ?? []) : []}
        team={openRow ? (data?.teams[openRow.project_id] ?? []) : []}
        viewerId={viewer.id}
        onPatch={writer.patch}
        onStatus={setStatus}
        onAddSub={addSubtask}
        onRemove={remove}
      />
    </div>
  )
}

function MyTaskRow({
  task,
  project,
  subtasks,
  comments,
  onToggle,
  onOpen,
}: {
  task: TaskRow
  project: MyProject | undefined
  subtasks: TaskRow[]
  comments: number
  onToggle: () => void
  onOpen: () => void
}) {
  const t = useT("projects")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const status = statusOf(task)
  const doneSubs = subtasks.filter((s) => s.done).length
  const due = task.due_date ? new Date(`${task.due_date}T00:00:00`) : null
  const overdue =
    due && !task.done && differenceInCalendarDays(due, new Date()) < 0

  return (
    <div
      className={cn(
        ROW_GRID,
        "group/task border-border/50 hover:bg-muted/20 gutter-x relative min-h-12 border-b max-md:min-h-14",
      )}
    >
      <Checkbox
        className="relative z-10"
        checked={task.done}
        onCheckedChange={onToggle}
        aria-label={task.done ? t("markUndone") : t("markDone")}
      />
      <div className="flex min-w-0 flex-col pr-3">
        <div className="flex min-w-0 items-center gap-2">
          {/* On a phone the whole row opens the task. */}
          <button
            type="button"
            onClick={onOpen}
            className={cn(
              "min-w-0 truncate text-left hover:underline max-md:after:absolute max-md:after:inset-0",
              task.done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </button>
          {subtasks.length > 0 && (
            <span className="text-muted-foreground shrink-0 text-[13px] tabular-nums">
              {doneSubs}/{subtasks.length}
            </span>
          )}
          {comments > 0 && (
            <span
              className="text-muted-foreground flex shrink-0 items-center gap-1 text-[13px] tabular-nums"
              aria-label={t("commentCount", { n: comments })}
            >
              <RiMessage3Line className="size-3.5" />
              {comments}
            </span>
          )}
        </div>
        {/* Project and status get their own columns from md up. */}
        {project && (
          <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-[13px] md:hidden">
            <StatusDot status={status} />
            <span className="truncate">{project.name}</span>
          </span>
        )}
      </div>
      <div className="hidden min-w-0 pr-3 md:block">
        {project && (
          <Link
            href={projectHref(project, "tasks")}
            className="text-muted-foreground hover:text-foreground flex min-w-0 items-center gap-1.5 text-[13px]"
          >
            <ProjectAvatar
              id={project.id}
              name={project.name}
              className="size-4 shrink-0 rounded-[4px]"
            />
            <span className="truncate">{project.name}</span>
          </Link>
        )}
      </div>
      <span className="text-muted-foreground hidden items-center gap-1.5 text-[13px] md:flex">
        <StatusDot status={status} />
        {t(STATUS_LABEL[status])}
      </span>
      <span
        className={cn(
          "text-[13px] tabular-nums",
          due
            ? overdue
              ? "text-destructive"
              : isToday(due) && !task.done
                ? "text-warning"
                : "text-foreground"
            : "text-muted-foreground",
        )}
      >
        {due ? (
          dueLabel(task.due_date!, dateLocale, {
            today: tc("today"),
            tomorrow: t("tomorrow"),
          })
        ) : (
          <EmptyValue />
        )}
      </span>
    </div>
  )
}
