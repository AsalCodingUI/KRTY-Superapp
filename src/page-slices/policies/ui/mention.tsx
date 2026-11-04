"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ProjectStatusIcon } from "@/page-slices/projects/ui/ProjectStatusIcon"
import type { ProjectStatus } from "@/page-slices/projects/lib/status"
import {
  keys,
  supabase,
  type TaskRow,
} from "@/page-slices/projects/ui/workspace/data"
import {
  statusOf,
  type TaskStatus,
} from "@/page-slices/projects/ui/workspace/task-data"
import { useT } from "@/shared/i18n/client"
import {
  MENTION_MD,
  MENTION_MD_START,
  mentionMarkdown,
  mentionPrefix,
  parseMentionHref,
  unescapeMentionLabel,
  type MentionKind,
} from "@/shared/lib/mentions"
import { linkKey } from "@/shared/lib/url-params"
import { PluginKey } from "@tiptap/pm/state"
import {
  Extension,
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
  type NodeViewProps,
} from "@tiptap/react"
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

/*
 * @mentions: "@" opens a list of people (the project's team, or everyone in
 * editors without a project) and the project's tasks. A pick goes in as a
 * pill (an inline atom); in Markdown it's a link with the mention:// scheme
 * (format in shared/lib/mentions). People show their picture and current
 * name, tasks their status and current title, and a task opens on click.
 */

type MentionAttrs = {
  kind: MentionKind
  id: string | null
  projectId: string | null
  label: string
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type Person = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

/** Everyone's name and picture (a small studio: one list, cached). */
function usePeople(enabled = true) {
  return useQuery({
    queryKey: ["mention-people"],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase()
        .from("profiles")
        .select("id, full_name, avatar_url")
        .order("full_name")
      return (data ?? []) as Person[]
    },
  })
}

/** Profile ids on a project's team. */
function useTeamIds(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ["mention-team", projectId],
    enabled: Boolean(projectId),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase()
        .from("project_assignments")
        .select("user_id")
        .eq("project_id", projectId!)
      return ((data ?? []) as { user_id: string }[]).map((r) => r.user_id)
    },
  })
}

/** A project's tasks; the same query (and cache) as the task board's. */
function useProjectTasks(projectId: string | null | undefined) {
  return useQuery({
    queryKey: keys.tasks(projectId ?? ""),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await supabase()
        .from("project_tasks")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at")
      return (data ?? []) as TaskRow[]
    },
  })
}

/** The task board's icons (dashed, half, open ring, check). */
const STATUS_ICON: Record<TaskStatus, ProjectStatus> = {
  todo: "Planned",
  in_progress: "Active",
  review: "Review",
  done: "Completed",
}

const fold = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()

export const taskHref = (projectId: string, id: string, title?: string) =>
  `/projects/${projectId}/tasks?task=${title ? linkKey(title, id) : id}`

// ---------------------------------------------------------------------------
// The pill
// ---------------------------------------------------------------------------

const PILL =
  "bg-muted text-foreground inline-flex max-w-full items-center gap-1 rounded-md px-1.5 align-baseline text-[0.92em] leading-[1.45] font-medium [overflow-wrap:anywhere]"

function PersonPill({ attrs }: { attrs: MentionAttrs }) {
  const { data: people } = usePeople(Boolean(attrs.id))
  const person = attrs.id ? people?.find((p) => p.id === attrs.id) : undefined
  const name = person?.full_name || attrs.label
  return (
    <span className={PILL} data-mention="person">
      {attrs.id && (
        <Avatar className="size-4 self-center">
          <AvatarImage src={person?.avatar_url || undefined} alt="" />
          <AvatarFallback className="text-[9px]">{name}</AvatarFallback>
        </Avatar>
      )}
      <span className="min-w-0 truncate">{attrs.id ? name : `@${name}`}</span>
    </span>
  )
}

function TaskPill({
  attrs,
  editable,
}: {
  attrs: MentionAttrs
  editable: boolean
}) {
  const t = useT("policies")
  const router = useRouter()
  const { data: tasks } = useProjectTasks(attrs.id ? attrs.projectId : null)
  const task = attrs.id ? tasks?.find((x) => x.id === attrs.id) : undefined
  const title = task?.title || attrs.label
  const icon = (
    <ProjectStatusIcon
      status={STATUS_ICON[task ? statusOf(task) : "todo"]}
      className="size-3.5 self-center"
    />
  )
  if (!attrs.id || !attrs.projectId)
    return (
      <span className={PILL} data-mention="task">
        #{title}
      </span>
    )
  const href = taskHref(attrs.projectId, attrs.id, task?.title)
  return (
    <a
      href={href}
      title={t("mentionOpenTask")}
      data-mention="task"
      className={cn(PILL, "hover:bg-accent cursor-pointer no-underline!")}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault()
        // While writing, a new tab keeps the unsaved document.
        if (editable || e.metaKey || e.ctrlKey) window.open(href, "_blank")
        else router.push(href)
      }}
    >
      {icon}
      <span className="min-w-0 truncate">{title}</span>
    </a>
  )
}

function MentionView({ node, editor }: NodeViewProps) {
  const attrs = node.attrs as MentionAttrs
  return (
    <NodeViewWrapper as="span" className="mention-pill">
      {attrs.kind === "task" ? (
        <TaskPill attrs={attrs} editable={editor.isEditable} />
      ) : (
        <PersonPill attrs={attrs} />
      )}
    </NodeViewWrapper>
  )
}

/** The pill node; in every editor, so mentions read back anywhere. */
export const Mention = Node.create({
  name: "mention",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      kind: { default: "person" },
      id: { default: null },
      projectId: { default: null },
      label: { default: "" },
    }
  },

  parseHTML() {
    return [
      {
        tag: "span[data-mention]",
        getAttrs: (el) => {
          const e = el as HTMLElement
          return {
            kind: e.dataset.mention === "task" ? "task" : "person",
            id: e.dataset.id || null,
            projectId: e.dataset.project || null,
            label: e.dataset.label ?? e.textContent?.replace(/^[@#]/, "") ?? "",
          }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const a = node.attrs as MentionAttrs
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-mention": a.kind,
        "data-id": a.id ?? undefined,
        "data-project": a.projectId ?? undefined,
        "data-label": a.label,
      }),
      `${mentionPrefix(a.kind)}${a.label}`,
    ]
  },

  renderText({ node }) {
    const a = node.attrs as MentionAttrs
    return `${mentionPrefix(a.kind)}${a.label}`
  },

  markdownTokenName: "mention",
  markdownTokenizer: {
    name: "mention",
    level: "inline",
    start: (src: string) => src.search(MENTION_MD_START),
    tokenize: (src: string) => {
      const m = MENTION_MD.exec(src)
      const ref = m && parseMentionHref(m[3])
      if (!m || !ref) return undefined
      // "@" belongs with people, "#" with tasks; anything else is a link.
      if (mentionPrefix(ref.kind) !== m[1]) return undefined
      return {
        type: "mention",
        raw: m[0],
        kind: ref.kind,
        id: ref.id,
        projectId: ref.projectId,
        label: unescapeMentionLabel(m[2]),
      }
    },
  },
  parseMarkdown: (token, helpers) =>
    helpers.createNode("mention", {
      kind: token.kind as string,
      id: (token.id as string | null) ?? null,
      projectId: (token.projectId as string | null) ?? null,
      label: token.label as string,
    }),
  renderMarkdown: (node) => {
    const a = (node.attrs ?? {}) as MentionAttrs
    return mentionMarkdown(
      { kind: a.kind, id: a.id, projectId: a.projectId },
      a.label || "",
    )
  },

  addNodeView() {
    return ReactNodeViewRenderer(MentionView, { as: "span" })
  },
})

// ---------------------------------------------------------------------------
// The "@" list
// ---------------------------------------------------------------------------

type MenuState = SuggestionProps<unknown, MentionAttrs> | null

/** Bridges the "@" suggestion plugin to <MentionMenu> (as the "/" menu). */
export function createMentionBridge() {
  let listener: ((s: MenuState) => void) | null = null
  let keyHandler: ((e: KeyboardEvent) => boolean) | null = null
  return {
    subscribe(fn: (s: MenuState) => void) {
      listener = fn
      return () => {
        listener = null
      }
    },
    setKeyHandler(fn: ((e: KeyboardEvent) => boolean) | null) {
      keyHandler = fn
    },
    emit(s: MenuState) {
      listener?.(s)
    },
    key(e: KeyboardEvent) {
      return keyHandler?.(e) ?? false
    },
  }
}

export type MentionBridge = ReturnType<typeof createMentionBridge>

const mentionKey = new PluginKey("mentionSuggestion")

/** Typing "@" opens <MentionMenu>; a pick becomes a pill and a space. */
export function MentionSuggestion(bridge: MentionBridge) {
  return Extension.create({
    name: "mentionSuggestion",
    addProseMirrorPlugins() {
      return [
        Suggestion<unknown, MentionAttrs>({
          editor: this.editor,
          pluginKey: mentionKey,
          char: "@",
          allow: ({ state, range }) =>
            !state.doc.resolve(range.from).parent.type.spec.code,
          // The menu filters its own data (it may still be loading).
          items: () => [],
          command: ({ editor, range, props }) => {
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                { type: "mention", attrs: props },
                { type: "text", text: " " },
              ])
              .run()
          },
          render: () => ({
            onStart: (props) => bridge.emit(props),
            onUpdate: (props) => bridge.emit(props),
            onKeyDown: ({ event }) => {
              if (event.key === "Escape") {
                bridge.emit(null)
                // Only the list closes, not the dialog the editor sits in.
                event.stopPropagation()
                return true
              }
              return bridge.key(event)
            },
            onExit: () => bridge.emit(null),
          }),
        }),
      ]
    },
  })
}

type Item =
  | { key: string; kind: "person"; attrs: MentionAttrs; person: Person }
  | { key: string; kind: "task"; attrs: MentionAttrs; task: TaskRow }

const MAX_EACH = 6

/**
 * The "@" list: Orang (the project's team, or everyone) and, in a project,
 * Tugas (its tasks by title, open ones first). Arrows, Enter/Tab, Esc.
 */
export function MentionMenu({
  bridge,
  projectId,
}: {
  bridge: MentionBridge
  projectId?: string | null
}) {
  const t = useT("policies")
  const [state, setState] = useState<MenuState>(null)
  const [index, setIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const open = Boolean(state)

  useEffect(
    () =>
      bridge.subscribe((s) => {
        setState(s)
        setIndex(0)
      }),
    [bridge],
  )

  // Loaded once the list is first opened.
  const [wanted, setWanted] = useState(false)
  useEffect(() => {
    if (open) setWanted(true)
  }, [open])
  const { data: people = [] } = usePeople(wanted)
  const { data: team } = useTeamIds(wanted ? projectId : null)
  const { data: tasks = [] } = useProjectTasks(wanted ? projectId : null)

  const query = fold(state?.query ?? "")
  const items = useMemo<Item[]>(() => {
    if (!open) return []
    const teamIds = projectId && team ? new Set(team) : null
    const persons = people
      .filter((p) => (teamIds ? teamIds.has(p.id) : true))
      .filter((p) => fold(p.full_name ?? "").includes(query))
      .slice(0, MAX_EACH)
      .map(
        (p): Item => ({
          key: `p:${p.id}`,
          kind: "person",
          person: p,
          attrs: {
            kind: "person",
            id: p.id,
            projectId: null,
            label: p.full_name || "?",
          },
        }),
      )
    const taskItems = projectId
      ? tasks
          .filter((x) => fold(x.title).includes(query))
          .sort((a, b) => Number(a.done) - Number(b.done))
          .slice(0, MAX_EACH)
          .map(
            (x): Item => ({
              key: `t:${x.id}`,
              kind: "task",
              task: x,
              attrs: {
                kind: "task",
                id: x.id,
                projectId,
                label: x.title,
              },
            }),
          )
      : []
    return [...persons, ...taskItems]
  }, [open, people, team, tasks, projectId, query])

  // Gone when the editor loses focus or anything else is pressed.
  const editor = state?.editor
  useEffect(() => {
    if (!editor) return
    const hide = () => setState(null)
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null
      if (!target) return
      if (listRef.current?.contains(target)) return
      if (editor.view.dom.contains(target)) return
      hide()
    }
    editor.on("blur", hide)
    document.addEventListener("pointerdown", onPointerDown, true)
    return () => {
      editor.off("blur", hide)
      document.removeEventListener("pointerdown", onPointerDown, true)
    }
  }, [editor])

  useEffect(() => {
    bridge.setKeyHandler((e) => {
      if (!state || items.length === 0) return false
      if (e.key === "ArrowDown") {
        setIndex((i) => (i + 1) % items.length)
        return true
      }
      if (e.key === "ArrowUp") {
        setIndex((i) => (i - 1 + items.length) % items.length)
        return true
      }
      if (e.key === "Enter" || e.key === "Tab") {
        state.command(items[Math.min(index, items.length - 1)].attrs)
        return true
      }
      return false
    })
    return () => bridge.setKeyHandler(null)
  }, [bridge, state, items, index])

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${index}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [index])

  const rect = state?.clientRect?.()
  if (!state || !rect) return null

  // As the "/" menu: below the caret, or above when there's more room.
  const GAP = 6
  const MARGIN = 12
  const roomBelow = window.innerHeight - rect.bottom - GAP - MARGIN
  const roomAbove = rect.top - GAP - MARGIN
  const below = roomBelow >= 240 || roomBelow >= roomAbove
  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.max(MARGIN, Math.min(rect.left, window.innerWidth - 288)),
    maxHeight: Math.min(352, below ? roomBelow : roomAbove),
    ...(below
      ? { top: rect.bottom + GAP }
      : { bottom: window.innerHeight - rect.top + GAP }),
  }

  const firstTask = items.findIndex((i) => i.kind === "task")

  return createPortal(
    <div
      ref={listRef}
      role="listbox"
      aria-label={t("mentionMenu")}
      style={style}
      className="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 nest-rounded-popover nest-p-2 no-scrollbar z-[60] w-72 max-w-[calc(100vw-24px)] overflow-y-auto overscroll-contain text-sm shadow-(--elev-4)"
    >
      {items.length === 0 ? (
        <p className="text-muted-foreground px-2 py-3 text-center">
          {t("mentionEmpty", { query: state.query })}
        </p>
      ) : (
        items.map((item, i) => (
          <div key={item.key}>
            {(i === 0 || i === firstTask) && (
              <p className="text-muted-foreground px-2 pt-1.5 pb-1 text-xs">
                {item.kind === "person"
                  ? t("mentionPeople")
                  : t("mentionTasks")}
              </p>
            )}
            <button
              type="button"
              role="option"
              aria-selected={i === index}
              data-index={i}
              onMouseEnter={() => setIndex(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => state.command(item.attrs)}
              className={cn(
                "rounded-nested flex w-full items-center gap-2.5 px-2 py-1.5 text-left",
                i === index && "bg-muted",
              )}
            >
              {item.kind === "person" ? (
                <Avatar size="sm" className="size-6">
                  <AvatarImage src={item.person.avatar_url || undefined} />
                  <AvatarFallback>
                    {item.person.full_name || "?"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <span className="flex size-6 shrink-0 items-center justify-center">
                  <ProjectStatusIcon
                    status={STATUS_ICON[statusOf(item.task)]}
                  />
                </span>
              )}
              <span className="text-foreground min-w-0 truncate">
                {item.attrs.label}
              </span>
            </button>
          </div>
        ))
      )}
    </div>,
    document.body,
  )
}
