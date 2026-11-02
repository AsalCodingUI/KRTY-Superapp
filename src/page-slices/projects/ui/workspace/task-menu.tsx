"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  ContextTarget,
  copyText,
  type CtxItem,
  type CtxSection,
} from "@/shared/context-menu"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiDeleteBinLine } from "@/shared/ui/lucide-icons"
import { addDays, format, nextMonday } from "date-fns"
import {
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CalendarX,
  Circle,
  CircleCheck,
  Copy,
  CopyPlus,
  CornerLeftUp,
  FolderOpen,
  Layers,
  ListPlus,
  Pencil,
  Sun,
  Sunrise,
  UserRound,
  UserRoundX,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import type * as React from "react"
import { toast } from "sonner"
import type { TaskRow, TeamMember } from "./data"
import { StatusDot } from "./TaskBoard"
import {
  STATUS_LABEL,
  TASK_STATUSES,
  statusOf,
  type TaskStatus,
} from "./task-data"
import { initials } from "./task-utils"

/*
 * Right-click on a task (board card, list row, the open task's panel), a
 * subtask or a comment — the app-wide menu
 * (shared/context-menu). Every action calls the same handler the page's
 * own buttons call; a handler left out hides its item. Tasks have no
 * per-role rules: anyone on the project may change or delete them (RLS),
 * as the buttons allow. Comments: only the author deletes theirs.
 */

type Phase = { id: string; name: string }

export type TaskMenuConfig = {
  task: TaskRow
  /** The task's own link (opens it): Buka / tab baru / Salin link. */
  href: string
  viewerId: string | null
  /** The project's team, for "Assign ke". */
  team?: TeamMember[]
  /** The project's phases, or a loader (run when the submenu opens). */
  phases?: Phase[] | (() => Promise<Phase[]>)
  /** Cross-project lists: "Buka project". */
  project?: { href: string }
  onStatus?: (task: TaskRow, status: TaskStatus) => void
  onPatch?: (id: string, patch: Partial<TaskRow>) => void
  /** "Pilih tanggal…": the page's own date picker. */
  onPickDue?: () => void
  onRename?: () => void
  onAddSubtask?: () => void
  onDuplicate?: () => Promise<unknown> | void
  /** Opens the page's confirm dialog (subtasks and comments go too). */
  onDelete?: () => void
}

const statusIcon = (status: TaskStatus) =>
  function StatusIcon({ className }: { className?: string }) {
    return <StatusDot status={status} className={className} />
  }

const personIcon = (person: TeamMember) =>
  function PersonIcon({ className }: { className?: string }) {
    return (
      <Avatar className={cn("size-4", className)}>
        <AvatarImage src={person.avatar_url || undefined} alt="" />
        <AvatarFallback className="bg-muted text-muted-foreground text-[8px] font-medium">
          {initials(person.full_name)}
        </AvatarFallback>
      </Avatar>
    )
  }

const ymd = (d: Date) => format(d, "yyyy-MM-dd")

/** Builds a task's sections (call it when the menu opens). */
export function useTaskMenu() {
  const t = useT("taskmenu")
  const tp = useT("projects")
  const tm = useT("ctxmenu")
  const locale = useDateLocale()
  const router = useRouter()

  return useCallback(
    (cfg: TaskMenuConfig): CtxSection[] => {
      const { task, onStatus, onPatch } = cfg
      const status = statusOf(task)
      const isSub = Boolean(task.parent_id)

      const statusItems: CtxItem[] = onStatus
        ? [
            task.done
              ? {
                  id: "undone",
                  label: tp("markUndone"),
                  icon: Circle,
                  onSelect: () => onStatus(task, "todo"),
                }
              : {
                  id: "done",
                  label: tp("markDone"),
                  icon: CircleCheck,
                  onSelect: () => onStatus(task, "done"),
                },
            {
              id: "status",
              label: t("status"),
              icon: statusIcon(status),
              hint: tp(STATUS_LABEL[status]),
              submenu: TASK_STATUSES.map((s) => ({
                id: s,
                label: tp(STATUS_LABEL[s]),
                icon: statusIcon(s),
                role: "radio" as const,
                checked: s === status,
                onSelect: () => {
                  if (s !== status) onStatus(task, s)
                },
              })),
            },
          ]
        : []

      const assignee = cfg.team?.find((m) => m.id === task.assignee_id)
      const team = [...(cfg.team ?? [])].sort(
        // The viewer first: "take it" is the common pick.
        (a, b) => Number(b.id === cfg.viewerId) - Number(a.id === cfg.viewerId),
      )
      const assignItem: CtxItem | null =
        onPatch && cfg.team
          ? {
              id: "assign",
              label: t("assignTo"),
              icon: assignee ? personIcon(assignee) : UserRound,
              hint: assignee?.full_name?.split(" ")[0] ?? undefined,
              submenu: [
                ...team.map((m) => ({
                  id: `assign-${m.id}`,
                  label: m.full_name ?? tp("unknownMember"),
                  icon: personIcon(m),
                  hint: m.id === cfg.viewerId ? t("you") : undefined,
                  role: "radio" as const,
                  checked: m.id === task.assignee_id,
                  onSelect: () => {
                    if (m.id !== task.assignee_id)
                      onPatch(task.id, { assignee_id: m.id })
                  },
                })),
                {
                  id: "assign-none",
                  label: tp("noPic"),
                  icon: UserRoundX,
                  role: "radio" as const,
                  checked: !task.assignee_id,
                  onSelect: () => {
                    if (task.assignee_id)
                      onPatch(task.id, { assignee_id: null })
                  },
                },
              ],
            }
          : null

      const today = new Date()
      const dueChoices: [string, string, Date, CtxItem["icon"]][] = [
        ["due-today", t("dueToday"), today, Sun],
        ["due-tomorrow", t("dueTomorrow"), addDays(today, 1), Sunrise],
        ["due-next-week", t("dueNextWeek"), nextMonday(today), CalendarRange],
      ]
      const dueItem: CtxItem | null = onPatch
        ? {
            id: "due",
            label: t("due"),
            icon: CalendarDays,
            hint: task.due_date
              ? format(new Date(`${task.due_date}T00:00:00`), "d MMM", {
                  locale,
                })
              : undefined,
            submenu: [
              ...dueChoices.map(([id, label, date, icon]) => ({
                id,
                label,
                icon,
                hint: format(date, "EEE, d MMM", { locale }),
                role: "radio" as const,
                checked: task.due_date === ymd(date),
                onSelect: () => {
                  if (task.due_date !== ymd(date))
                    onPatch(task.id, { due_date: ymd(date) })
                },
              })),
              {
                id: "due-pick",
                label: t("duePick"),
                icon: CalendarClock,
                hidden: !cfg.onPickDue,
                onSelect: () => cfg.onPickDue?.(),
              },
              {
                id: "due-clear",
                label: t("dueClear"),
                icon: CalendarX,
                hidden: !task.due_date,
                onSelect: () => onPatch(task.id, { due_date: null }),
              },
            ],
          }
        : null

      const phaseOptions = (phases: Phase[]): CtxItem[] =>
        phases.length === 0
          ? // Loaded for a project that runs without phases.
            [
              {
                id: "phase-none-here",
                label: t("phasesNone"),
                disabled: true,
              },
            ]
          : [
              ...phases.map((p) => ({
                id: `phase-${p.id}`,
                label: p.name,
                role: "radio" as const,
                checked: p.id === task.phase_id,
                onSelect: () => {
                  if (p.id !== task.phase_id)
                    onPatch?.(task.id, { phase_id: p.id })
                },
              })),
              {
                id: "phase-none",
                label: tp("noPhase"),
                role: "radio" as const,
                checked: !task.phase_id,
                onSelect: () => {
                  if (task.phase_id) onPatch?.(task.id, { phase_id: null })
                },
              },
            ]
      const phases = cfg.phases
      // A project without phases has nothing to move a task to.
      const phaseItem: CtxItem | null =
        onPatch &&
        phases &&
        !isSub &&
        !(Array.isArray(phases) && phases.length === 0)
          ? {
              id: "phase",
              label: t("phase"),
              icon: Layers,
              hint: Array.isArray(phases)
                ? phases.find((p) => p.id === task.phase_id)?.name
                : undefined,
              submenu: Array.isArray(phases)
                ? phaseOptions(phases)
                : async () => {
                    try {
                      return phaseOptions(await phases())
                    } catch {
                      toast.error(t("phasesFailed"))
                      return []
                    }
                  },
            }
          : null

      const editItems = [
        ...statusItems,
        assignItem,
        dueItem,
        phaseItem,
        cfg.onRename && {
          id: "rename",
          label: t("rename"),
          icon: Pencil,
          onSelect: cfg.onRename,
        },
        cfg.onAddSubtask && {
          id: "add-subtask",
          label: t("addSubtask"),
          icon: ListPlus,
          onSelect: cfg.onAddSubtask,
        },
        cfg.onDuplicate && {
          id: "duplicate",
          label: t("duplicate"),
          icon: CopyPlus,
          onSelect: cfg.onDuplicate,
        },
      ].filter((item): item is CtxItem => Boolean(item))

      return [
        {
          label: task.title,
          items: [
            {
              id: "copy-title",
              label: t("copyTitle"),
              icon: Copy,
              onSelect: async () => {
                if (await copyText(task.title)) toast.success(t("titleCopied"))
                else toast.error(tm("copyFailed"))
              },
            },
            ...(cfg.project
              ? [
                  {
                    id: "open-project",
                    label: t("openProject"),
                    icon: FolderOpen,
                    onSelect: () => router.push(cfg.project!.href),
                  },
                ]
              : []),
          ],
        },
        { items: editItems },
        {
          items: cfg.onDelete
            ? [
                {
                  id: "delete",
                  label: isSub ? tp("deleteSubtask") : tp("deleteTask"),
                  icon: RiDeleteBinLine,
                  destructive: true,
                  // The page's dialog asks first.
                  onSelect: cfg.onDelete,
                },
              ]
            : [],
        },
      ].filter((s) => s.items.length > 0)
    },
    [t, tp, tm, locale, router],
  )
}

/** A task card / row with its right-click menu. */
export function TaskContextTarget({
  menu,
  children,
}: {
  menu: TaskMenuConfig
  children: React.ReactElement<Record<string, unknown>>
}) {
  const build = useTaskMenu()
  return (
    <ContextTarget
      type="task"
      id={menu.task.id}
      label={menu.task.title}
      href={menu.href}
      // Its own buttons (title, comments, delete) say less than the task.
      suppress={["button"]}
      items={() => build(menu)}
    >
      {children}
    </ContextTarget>
  )
}

/** A subtask row (list view, task dialog). */
export function SubtaskContextTarget({
  sub,
  onToggle,
  onRemove,
  onOpenParent,
  children,
}: {
  sub: TaskRow
  onToggle: () => void
  /** Deletes at once (as the row's button): the menu asks first. */
  onRemove: () => void
  onOpenParent?: () => void
  children: React.ReactElement<Record<string, unknown>>
}) {
  const t = useT("taskmenu")
  const tp = useT("projects")
  const tm = useT("ctxmenu")
  return (
    <ContextTarget
      type="subtask"
      id={sub.id}
      label={sub.title}
      suppress={["button"]}
      items={(): CtxSection[] => [
        {
          label: `${t("groupSubtask")} · ${sub.title}`,
          items: [
            sub.done
              ? {
                  id: "undone",
                  label: tp("markUndone"),
                  icon: Circle,
                  onSelect: onToggle,
                }
              : {
                  id: "done",
                  label: tp("markDone"),
                  icon: CircleCheck,
                  onSelect: onToggle,
                },
            {
              id: "copy-title",
              label: t("copyTitle"),
              icon: Copy,
              onSelect: async () => {
                if (await copyText(sub.title)) toast.success(t("titleCopied"))
                else toast.error(tm("copyFailed"))
              },
            },
            ...(onOpenParent
              ? [
                  {
                    id: "open-parent",
                    label: t("openParent"),
                    icon: CornerLeftUp,
                    onSelect: onOpenParent,
                  },
                ]
              : []),
          ],
        },
        {
          items: [
            {
              id: "delete",
              label: tp("deleteSubtask"),
              icon: RiDeleteBinLine,
              destructive: true,
              confirm: true,
              onSelect: onRemove,
            },
          ],
        },
      ]}
    >
      {children}
    </ContextTarget>
  )
}

/** A comment in a task's thread. */
export function CommentContextTarget({
  id,
  body,
  author,
  onRemove,
  children,
}: {
  id: string
  body: string
  author: string
  /** Only for the author's own comments. */
  onRemove?: () => void
  children: React.ReactElement<Record<string, unknown>>
}) {
  const t = useT("taskmenu")
  const tp = useT("projects")
  const tm = useT("ctxmenu")
  return (
    <ContextTarget
      type="task-comment"
      id={id}
      label={author}
      suppress={["button"]}
      items={(): CtxSection[] => [
        {
          label: t("groupComment", { name: author }),
          items: [
            {
              id: "copy-comment",
              label: t("copyComment"),
              icon: Copy,
              onSelect: async () => {
                if (await copyText(body)) toast.success(t("commentCopied"))
                else toast.error(tm("copyFailed"))
              },
            },
          ],
        },
        {
          items: onRemove
            ? [
                {
                  id: "delete",
                  label: tp("deleteComment"),
                  icon: RiDeleteBinLine,
                  destructive: true,
                  confirm: true,
                  onSelect: onRemove,
                },
              ]
            : [],
        },
      ]}
    >
      {children}
    </ContextTarget>
  )
}
