"use client"

import { Panel, PanelEmpty } from "@/components/panel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ContextTarget, copyText, type CtxItem } from "@/shared/context-menu"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  RiDraggable,
  RiEyeLine,
  RiEyeOffLine,
  RiGroupLine,
  RiUserAddLine,
} from "@/shared/ui/lucide-icons"
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format } from "date-fns"
import {
  ArrowDown,
  ArrowUp,
  ChevronsUp,
  Copy,
  Eye,
  EyeOff,
} from "@/components/icons"
import { toast } from "sonner"
import type { SantuyData, SantuyMember } from "../data"
import { dayDate, PersonAvatar, personName } from "./shared"

/**
 * The queue, in presenting order (it loops). Stakeholders/PMs drag to
 * reorder, add people, and hide people (active = false): hidden ones stay
 * listed, dimmed, at the bottom; the rotation skips them. Showing someone
 * again puts them at the end of the queue. Nothing is deleted here.
 */
export function SantuyQueue({
  data,
  canEdit,
  nextDates,
  upcomingId,
  busy,
  onChange,
  onAdd,
}: {
  data: SantuyData
  canEdit: boolean
  /** Each member's next session date. */
  nextDates: Map<string, string>
  /** Whose turn the rotation gives the upcoming session. */
  upcomingId: string | null
  busy: boolean
  /**
   * The whole queue after an edit, in order; `note` is the success toast,
   * `undo` the queue to go back to.
   */
  onChange: (
    members: SantuyMember[],
    note: string,
    undo?: SantuyMember[],
  ) => void
  onAdd: () => void
}) {
  const t = useT("santuy")
  const dateLocale = useDateLocale()
  const active = data.members.filter((m) => m.active)
  const left = data.members.filter((m) => !m.active)
  const nameOf = (id: string) => personName(data.people.get(id))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const onDragEnd = ({ active: a, over }: DragEndEvent) => {
    if (!over || a.id === over.id) return
    const from = active.findIndex((m) => m.profileId === a.id)
    const to = active.findIndex((m) => m.profileId === over.id)
    if (from < 0 || to < 0) return
    onChange([...arrayMove(active, from, to), ...left], t("reordered"))
  }

  const hide = (id: string) =>
    onChange(
      [
        ...active.filter((m) => m.profileId !== id),
        ...left,
        { ...active.find((m) => m.profileId === id)!, active: false },
      ],
      t("hidden", { name: nameOf(id) }),
      data.members,
    )

  const restore = (id: string) =>
    onChange(
      [
        ...active,
        { ...left.find((m) => m.profileId === id)!, active: true },
        ...left.filter((m) => m.profileId !== id),
      ],
      t("restored", { name: nameOf(id) }),
    )

  // Right-click menu (shared/context-menu): reorder by one, make next in
  // line, hide / show, copy the name. Each queue edit can be undone.
  const move = (id: string, to: number) => {
    const from = active.findIndex((m) => m.profileId === id)
    if (from < 0 || to < 0 || to >= active.length || to === from) return
    onChange(
      [...arrayMove(active, from, to), ...left],
      t("reordered"),
      data.members,
    )
  }
  const upcomingIndex = active.findIndex((m) => m.profileId === upcomingId)
  /** Right after the upcoming presenter: the turn after theirs. */
  const nextSlot = (from: number) =>
    from < upcomingIndex ? upcomingIndex : upcomingIndex + 1
  const makeNext = (id: string) => {
    const from = active.findIndex((m) => m.profileId === id)
    if (from < 0 || upcomingIndex < 0) return
    onChange(
      [...arrayMove(active, from, nextSlot(from)), ...left],
      t("ctxMadeNext", { name: nameOf(id), after: nameOf(upcomingId!) }),
      data.members,
    )
  }
  const copyName = async (id: string) => {
    if (await copyText(nameOf(id))) toast.success(t("ctxNameCopied"))
  }
  const activeItems = (id: string, index: number): CtxItem[] => [
    {
      id: "up",
      label: t("ctxMoveUp"),
      icon: ArrowUp,
      hidden: !canEdit,
      disabled: busy || index === 0,
      onSelect: () => move(id, index - 1),
    },
    {
      id: "down",
      label: t("ctxMoveDown"),
      icon: ArrowDown,
      hidden: !canEdit,
      disabled: busy || index === active.length - 1,
      onSelect: () => move(id, index + 1),
    },
    {
      id: "next",
      label: t("ctxMakeNext"),
      icon: ChevronsUp,
      hint: upcomingId ? `↳ ${nameOf(upcomingId)}` : undefined,
      // Not the upcoming presenter, nor already the one after them.
      hidden:
        !canEdit ||
        upcomingIndex < 0 ||
        id === upcomingId ||
        index === (upcomingIndex + 1) % active.length,
      disabled: busy,
      onSelect: () => makeNext(id),
    },
    {
      id: "hide",
      label: t("hide"),
      icon: EyeOff,
      hidden: !canEdit,
      disabled: busy,
      onSelect: () => hide(id),
    },
    {
      id: "copy-name",
      label: t("ctxCopyName"),
      icon: Copy,
      onSelect: () => copyName(id),
    },
  ]
  const hiddenItems = (id: string): CtxItem[] => [
    {
      id: "show",
      label: t("show"),
      icon: Eye,
      hidden: !canEdit,
      disabled: busy,
      onSelect: () => restore(id),
    },
    {
      id: "copy-name",
      label: t("ctxCopyName"),
      icon: Copy,
      onSelect: () => copyName(id),
    },
  ]
  const visible = (items: CtxItem[]) => items.filter((item) => !item.hidden)

  const first = active[0]
  const last = active[active.length - 1]

  return (
    <Panel
      title={t("queueTitle")}
      meta={active.length}
      action={
        canEdit ? (
          <Button
            variant="ghost"
            size="sm"
            className="-mr-2"
            onClick={onAdd}
            disabled={busy}
          >
            <RiUserAddLine data-icon="inline-start" />
            {t("addPerson")}
          </Button>
        ) : undefined
      }
    >
      {active.length === 0 ? (
        <PanelEmpty icon={<RiGroupLine />} title={t("emptyQueue")} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={active.map((m) => m.profileId)}
            strategy={verticalListSortingStrategy}
          >
            <ol className={cn(busy && "pointer-events-none opacity-70")}>
              {active.map((m, index) => {
                const next = nextDates.get(m.profileId)
                return (
                  <QueueRow
                    key={m.profileId}
                    id={m.profileId}
                    label={nameOf(m.profileId)}
                    menu={() => visible(activeItems(m.profileId, index))}
                    index={index}
                    canEdit={canEdit}
                    dragLabel={t("dragHandle")}
                    hideLabel={t("hide")}
                    onHide={() => hide(m.profileId)}
                  >
                    <PersonAvatar person={data.people.get(m.profileId)} />
                    <span className="text-foreground min-w-0 flex-1 truncate text-sm">
                      {nameOf(m.profileId)}
                    </span>
                    {next && (
                      <span className="text-tertiary-foreground text-meta shrink-0 tabular-nums">
                        {format(dayDate(next), "d MMM", {
                          locale: dateLocale,
                        })}
                      </span>
                    )}
                  </QueueRow>
                )
              })}
            </ol>
          </SortableContext>
        </DndContext>
      )}
      {left.length > 0 && (
        <>
          <div className="border-border text-muted-foreground text-meta flex items-baseline gap-2 border-t px-4 pt-3 pb-1">
            {t("hiddenTitle")}
            <span className="text-tertiary-foreground tabular-nums">
              {left.length}
            </span>
          </div>
          <ul>
            {left.map((m) => (
              <ContextTarget
                key={m.profileId}
                type="santuy-member"
                id={m.profileId}
                label={nameOf(m.profileId)}
                items={() => visible(hiddenItems(m.profileId))}
                suppress={["button"]}
              >
                <li className="flex min-h-11 items-center gap-3 px-4 py-1.5">
                  <span className="w-5 shrink-0" />
                  <PersonAvatar
                    person={data.people.get(m.profileId)}
                    className="opacity-50 grayscale"
                  />
                  <span className="text-tertiary-foreground min-w-0 flex-1 truncate text-sm">
                    {nameOf(m.profileId)}
                  </span>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={t("show")}
                      title={t("show")}
                      className="text-muted-foreground hover:text-foreground -mr-1 shrink-0"
                      disabled={busy}
                      onClick={() => restore(m.profileId)}
                    >
                      <RiEyeLine />
                    </Button>
                  )}
                </li>
              </ContextTarget>
            ))}
          </ul>
        </>
      )}
      {first && last && active.length > 1 && (
        <p className="text-muted-foreground border-border text-meta border-t px-4 py-2.5">
          {t("queueLoop", {
            last: nameOf(last.profileId),
            first: nameOf(first.profileId),
          })}
        </p>
      )}
    </Panel>
  )
}

function QueueRow({
  id,
  label,
  menu,
  index,
  canEdit,
  dragLabel,
  hideLabel,
  onHide,
  children,
}: {
  id: string
  /** The person's name (the menu's title). */
  label: string
  menu: () => CtxItem[]
  index: number
  canEdit: boolean
  dragLabel: string
  hideLabel: string
  onHide: () => void
  children: React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !canEdit })
  return (
    <ContextTarget
      type="santuy-member"
      id={id}
      label={label}
      items={menu}
      // The handle and hide buttons are covered by the row's items.
      suppress={["button"]}
    >
      <li
        ref={setNodeRef}
        style={{ transform: CSS.Translate.toString(transform), transition }}
        className={cn(
          "group/row bg-card border-border relative flex min-h-12 items-center gap-3 border-b px-4 py-2 last:border-b-0",
          isDragging && "shadow-sheet z-10 rounded-lg border-transparent",
        )}
      >
        {canEdit ? (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={dragLabel}
            className="text-muted-foreground hover:text-foreground text-meta -ml-1 flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center tabular-nums active:cursor-grabbing"
          >
            <span className="group-hover/row:hidden pointer-coarse:hidden">
              {index + 1}
            </span>
            <RiDraggable className="hidden size-4 group-hover/row:block pointer-coarse:block" />
          </button>
        ) : (
          <span className="text-muted-foreground text-meta -ml-1 w-5 shrink-0 text-center tabular-nums">
            {index + 1}
          </span>
        )}
        {children}
        {canEdit && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={hideLabel}
            title={hideLabel}
            className="text-muted-foreground hover:text-foreground -mr-1 shrink-0 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
            onClick={onHide}
          >
            <RiEyeOffLine />
          </Button>
        )}
      </li>
    </ContextTarget>
  )
}
