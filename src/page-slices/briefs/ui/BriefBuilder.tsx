"use client"

import { setBriefSets } from "@/app/(main)/projects/actions/brief-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { visibleSections } from "@/shared/lib/briefs/brief"
import { clientUrl } from "@/shared/lib/client-site"
import {
  BRIEF_SETS,
  type BriefAnswers,
  type BriefQuestion,
  type BriefSection,
  type BriefSet,
  hasOptions,
  isLayout,
  type QuestionType,
} from "@/shared/lib/briefs/types"
import { RiDeleteBinLine } from "@/shared/ui/lucide-icons"
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  AtSign,
  CalendarDays,
  ChevronDownSquare,
  Gauge,
  Hash,
  Link2,
  Phone,
  Pilcrow,
  SeparatorHorizontal,
  Star,
  TextQuote,
  ToggleRight,
  AlignLeft,
  Check,
  CircleDot,
  CloudUpload,
  Copy,
  ExternalLink,
  GripVertical,
  Heading,
  ListChecks,
  CornerDownRight,
  MoreHorizontal,
  Plus,
  Split,
  TextCursorInput,
  X,
} from "@/components/icons"
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import { patchBrief, type BriefListRow } from "../model/data"
import {
  briefTitleClass,
  ChoiceBadge,
  ChoiceHint,
  inlineInputClass,
  questionHelpClass,
  questionLabelClass,
  sectionTitleClass,
} from "./brief-ui"
import { BriefField } from "./fields"
import { SET_LABEL_KEYS, SetIcon } from "./shared"

type BlockKind = QuestionType | "section"

type BlockGroup = "question" | "layout"

/** The "/" and "+" menus, in their two groups. */
const BLOCKS: {
  kind: BlockKind
  group: BlockGroup
  icon: typeof AlignLeft
  key: string
}[] = [
  { kind: "text", group: "question", icon: TextCursorInput, key: "typeText" },
  { kind: "textarea", group: "question", icon: AlignLeft, key: "typeTextarea" },
  { kind: "single", group: "question", icon: CircleDot, key: "typeSingle" },
  { kind: "multi", group: "question", icon: ListChecks, key: "typeMulti" },
  {
    kind: "dropdown",
    group: "question",
    icon: ChevronDownSquare,
    key: "typeDropdown",
  },
  { kind: "yesno", group: "question", icon: ToggleRight, key: "typeYesNo" },
  { kind: "email", group: "question", icon: AtSign, key: "typeEmail" },
  { kind: "phone", group: "question", icon: Phone, key: "typePhone" },
  { kind: "url", group: "question", icon: Link2, key: "typeUrl" },
  { kind: "number", group: "question", icon: Hash, key: "typeNumber" },
  { kind: "date", group: "question", icon: CalendarDays, key: "typeDate" },
  { kind: "scale", group: "question", icon: Gauge, key: "typeScale" },
  { kind: "rating", group: "question", icon: Star, key: "typeRating" },
  { kind: "files", group: "question", icon: CloudUpload, key: "typeFiles" },
  { kind: "section", group: "layout", icon: Heading, key: "blockSection" },
  { kind: "statement", group: "layout", icon: Pilcrow, key: "blockStatement" },
  {
    kind: "divider",
    group: "layout",
    icon: SeparatorHorizontal,
    key: "blockDivider",
  },
]

const GROUP_KEYS = {
  question: "groupQuestions",
  layout: "groupLayout",
} as const

const uid = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}`

const blankQuestion = (type: QuestionType, label = ""): BriefQuestion => ({
  id: uid("q"),
  type,
  label,
  ...(hasOptions(type) ? { options: ["", ""] } : {}),
  ...(type === "scale" ? { max: 10 } : type === "rating" ? { max: 5 } : {}),
  // Nothing to answer.
  ...(isLayout(type) ? { optional: true } : {}),
})

type SaveState = "idle" | "saving" | "saved" | "error"

/**
 * The questionnaire builder, full screen: the form as the client will see
 * it, edited in place. Type "/" (or press +) to add a question, drag the
 * handle to move it (also into another section), and the team's own
 * fields take their answers right here. Saves as you go.
 */
export function BriefBuilder({
  brief,
  onClose,
  onSaved,
}: {
  brief: BriefListRow
  onClose: () => void
  onSaved: () => void
}) {
  const t = useT("briefs")
  const [title, setTitle] = useState(brief.title)
  const [sections, setSections] = useState(brief.sections)
  const [answers, setAnswers] = useState(brief.answers)
  const [save, setSave] = useState<SaveState>("idle")
  const [dragId, setDragId] = useState<string | null>(null)
  const pending = useRef<{
    title?: string
    sections?: BriefSection[]
    answers?: BriefAnswers
  }>({})
  const timer = useRef<number | undefined>(undefined)
  const focusNext = useRef<string | null>(null)

  const flush = async () => {
    window.clearTimeout(timer.current)
    const patch = pending.current
    pending.current = {}
    if (!Object.keys(patch).length) return
    setSave("saving")
    try {
      await patchBrief(brief.id, patch)
      setSave("saved")
      onSaved()
    } catch {
      pending.current = { ...patch, ...pending.current }
      setSave("error")
      toast.error(t("saveFailed"))
    }
  }
  const schedule = (patch: typeof pending.current) => {
    pending.current = { ...pending.current, ...patch }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void flush(), 700)
  }
  const close = async () => {
    await flush()
    onClose()
  }

  const writeSections = (next: BriefSection[]) => {
    setSections(next)
    schedule({ sections: next })
  }
  const editSection = (id: string, change: (s: BriefSection) => BriefSection) =>
    writeSections(sections.map((s) => (s.id === id ? change(s) : s)))
  const editQuestion = (qid: string, patch: Partial<BriefQuestion>) =>
    writeSections(
      sections.map((s) => ({
        ...s,
        questions: s.questions.map((q) =>
          q.id === qid ? { ...q, ...patch } : q,
        ),
      })),
    )

  /** A block after `afterId` (a question) or at the end of `sectionId`. */
  const insert = (
    sectionId: string,
    kind: BlockKind,
    afterId?: string,
    label = "",
  ) => {
    if (kind === "section") {
      const at = sections.findIndex((s) => s.id === sectionId)
      const next = [...sections]
      const id = uid("custom")
      next.splice(at + 1, 0, {
        id,
        set: "common",
        title: "",
        questions: [blankQuestion("textarea")],
      })
      focusNext.current = `section:${id}`
      return writeSections(next)
    }
    const q = blankQuestion(kind, label)
    focusNext.current = label ? `slash:${sectionId}` : `q:${q.id}`
    editSection(sectionId, (s) => {
      const list = [...s.questions]
      const at = afterId
        ? list.findIndex((x) => x.id === afterId) + 1
        : list.length
      list.splice(at, 0, q)
      return { ...s, questions: list }
    })
  }

  // Focus what was just added.
  useEffect(() => {
    const key = focusNext.current
    if (!key) return
    focusNext.current = null
    document
      .querySelector<HTMLElement>(
        `[data-focus-key="${window.CSS.escape(key)}"]`,
      )
      ?.focus()
  })

  const setMode = async (set: BriefSet, mode: "ask" | "offer" | "off") => {
    const sets = brief.sets.filter((s) => s !== set)
    const offers = brief.offers.filter((s) => s !== set)
    if (mode === "ask") sets.push(set)
    if (mode === "offer") offers.push(set)
    await flush()
    const result = await setBriefSets(brief.id, sets, offers)
    if (!result.success) return void toast.error(result.error)
    onSaved()
  }

  // Sets brought in from the server (a set switched on): its sections join.
  useEffect(() => {
    setSections((local) => {
      const have = new Set(local.map((s) => s.id))
      const added = brief.sections.filter((s) => !have.has(s.id))
      return added.length
        ? [...local, ...added].sort(
            (a, b) =>
              brief.sections.findIndex((x) => x.id === a.id) -
              brief.sections.findIndex((x) => x.id === b.id),
          )
        : local
    })
  }, [brief.sections])

  const shown = visibleSections(sections, [...brief.sets, ...brief.offers], {
    drafts: true,
  })
  // "Show if" can point at any choice question that comes before.
  const flat = shown.flatMap((s) => s.questions)
  const sourcesFor = (id: string) =>
    flat
      .slice(
        0,
        flat.findIndex((x) => x.id === id),
      )
      .filter((x) => x.label.trim() && choiceOptions(x).length > 0)

  // Drag: questions within and across sections.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  const sectionOf = (id: string) =>
    sections.find((s) => s.id === id || s.questions.some((q) => q.id === id))
  const onDragStart = (e: DragStartEvent) => setDragId(String(e.active.id))
  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e
    if (!over) return
    const from = sectionOf(String(active.id))
    const to = sectionOf(String(over.id))
    if (!from || !to || from.id === to.id) return
    // Into another section: at the hovered question, or its end.
    const q = from.questions.find((x) => x.id === active.id)!
    setSections((list) =>
      list.map((s) => {
        if (s.id === from.id)
          return { ...s, questions: s.questions.filter((x) => x.id !== q.id) }
        if (s.id !== to.id) return s
        const at = s.questions.findIndex((x) => x.id === over.id)
        const next = [...s.questions]
        next.splice(at < 0 ? next.length : at, 0, q)
        return { ...s, questions: next }
      }),
    )
  }
  const onDragEnd = (e: DragEndEvent) => {
    setDragId(null)
    const { active, over } = e
    setSections((list) => {
      let next = list
      if (over && active.id !== over.id) {
        const s = list.find((x) => x.questions.some((q) => q.id === active.id))
        const from = s?.questions.findIndex((q) => q.id === active.id) ?? -1
        const to = s?.questions.findIndex((q) => q.id === over.id) ?? -1
        if (s && from >= 0 && to >= 0) {
          const questions = [...s.questions]
          const [item] = questions.splice(from, 1)
          questions.splice(to, 0, item)
          next = list.map((x) => (x.id === s.id ? { ...x, questions } : x))
        }
      }
      schedule({ sections: next })
      return next
    })
  }
  const dragged = useMemo(
    () => sections.flatMap((s) => s.questions).find((q) => q.id === dragId),
    [sections, dragId],
  )

  return (
    <Dialog open onOpenChange={(open) => !open && void close()}>
      <DialogContent
        bare
        showCloseButton={false}
        className="top-2 left-2 flex h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">{t("builderTitle")}</DialogTitle>
        <header className="border-border flex h-14 shrink-0 items-center gap-2 border-b px-3">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("close")}
            onClick={() => void close()}
          >
            <X />
          </Button>
          <span className="text-muted-foreground min-w-0 truncate text-sm">
            {t("builderTitle")} ·{" "}
            <span className="text-foreground">{title || "…"}</span>
          </span>
          <SaveStatus state={save} />
          <div className="ml-auto flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="sm" />}
              >
                {t("sets")}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-56">
                {BRIEF_SETS.map((set) => {
                  const mode = brief.sets.includes(set)
                    ? "ask"
                    : brief.offers.includes(set)
                      ? "offer"
                      : "off"
                  return (
                    <DropdownMenuSub key={set}>
                      <DropdownMenuSubTrigger>
                        <SetIcon set={set} />
                        <span className="flex-1">{t(SET_LABEL_KEYS[set])}</span>
                        <span className="text-muted-foreground text-xs">
                          {t(
                            mode === "ask"
                              ? "setAsk"
                              : mode === "offer"
                                ? "setOffer"
                                : "setOff",
                          )}
                        </span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                          value={mode}
                          onValueChange={(v) =>
                            v !== mode && void setMode(set, v as never)
                          }
                        >
                          <DropdownMenuRadioItem value="ask" closeOnClick>
                            {t("setAsk")}
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="offer" closeOnClick>
                            {t("setOffer")}
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="off" closeOnClick>
                            {t("setOff")}
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={
                <a
                  href={clientUrl(`/b/${brief.token}`)}
                  target="_blank"
                  rel="noreferrer"
                />
              }
              onClick={() => void flush()}
            >
              <ExternalLink data-icon="inline-start" />
              {t("preview")}
            </Button>
            <Button size="sm" onClick={() => void close()}>
              {t("done")}
            </Button>
          </div>
        </header>

        <div className="scroll-pane min-h-0 flex-1">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-12 px-6 py-12 sm:pl-16">
            <div className="flex flex-col gap-2">
              <input
                value={title}
                placeholder={t("fieldTitle")}
                aria-label={t("fieldTitle")}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (e.target.value.trim())
                    schedule({ title: e.target.value.trim() })
                }}
                className={cn(briefTitleClass, inlineInputClass, "w-full")}
              />
              <p className="text-muted-foreground text-xs">
                {t("builderHint")}
              </p>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDragCancel={() => setDragId(null)}
            >
              {shown.map((section, index) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  number={index + 1}
                  offered={brief.offers.includes(section.set)}
                  canRemove={section.id.startsWith("custom_")}
                  onChange={(change) => editSection(section.id, change)}
                  onRemove={() =>
                    writeSections(sections.filter((s) => s.id !== section.id))
                  }
                  onInsert={(kind, afterId, label) =>
                    insert(section.id, kind, afterId, label)
                  }
                >
                  <SortableContext
                    items={section.questions.map((q) => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {section.questions.map((q) => (
                      <QuestionBlock
                        key={q.id}
                        question={q}
                        sources={sourcesFor(q.id)}
                        condition={flat.find(
                          (x) => x.id === q.showIf?.question,
                        )}
                        teamAnswer={
                          section.team
                            ? typeof answers[q.id] === "string"
                              ? (answers[q.id] as string)
                              : ""
                            : undefined
                        }
                        onAnswer={(v) => {
                          const next = { ...answers, [q.id]: v }
                          setAnswers(next)
                          schedule({ answers: next })
                        }}
                        onChange={(patch) => editQuestion(q.id, patch)}
                        onInsert={(kind) => insert(section.id, kind, q.id)}
                        onDuplicate={() =>
                          editSection(section.id, (s) => {
                            const list = [...s.questions]
                            const at = list.findIndex((x) => x.id === q.id)
                            list.splice(at + 1, 0, { ...q, id: uid("q") })
                            return { ...s, questions: list }
                          })
                        }
                        onRemove={() =>
                          editSection(section.id, (s) => ({
                            ...s,
                            questions: s.questions.filter((x) => x.id !== q.id),
                          }))
                        }
                      />
                    ))}
                  </SortableContext>
                </SectionBlock>
              ))}
              <DragOverlay dropAnimation={null}>
                {dragged ? (
                  <div className="bg-popover border-border rounded-popover shadow-popover flex items-center gap-2 border px-3 py-2 text-sm">
                    <GripVertical className="text-muted-foreground size-4" />
                    {dragged.label || t("questionLabel")}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SaveStatus({ state }: { state: SaveState }) {
  const t = useT("briefs")
  if (state === "idle") return null
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1.5 text-xs",
        state === "error" ? "text-destructive-ink" : "text-muted-foreground",
      )}
    >
      {state === "saving" ? (
        <Spinner className="size-3" />
      ) : state === "saved" ? (
        <Check className="size-3" />
      ) : null}
      {state === "saving"
        ? t("saving")
        : state === "saved"
          ? t("saved")
          : t("saveFailed")}
    </span>
  )
}

/** The "/" and "+" menu: question types and a new section. */
function BlockMenu({
  filter,
  active,
  onPick,
  onHover,
}: {
  filter: string
  active: number
  onPick: (kind: BlockKind) => void
  onHover: (i: number) => void
}) {
  const t = useT("briefs")
  const items = filterBlocks(filter, t)
  if (!items.length) return null
  return (
    <div
      role="listbox"
      className="bg-popover border-border nest-rounded-popover nest-p-2 shadow-popover absolute top-full left-0 z-30 mt-1 max-h-80 w-60 overflow-y-auto border"
    >
      {items.map((b, i) => (
        <Fragment key={b.kind}>
          {(i === 0 || items[i - 1].group !== b.group) && (
            <p className="text-muted-foreground px-2 pt-1.5 pb-1 text-xs">
              {t(GROUP_KEYS[b.group])}
            </p>
          )}
          <button
            type="button"
            role="option"
            aria-selected={i === active}
            onMouseEnter={() => onHover(i)}
            onMouseDown={(e) => {
              e.preventDefault()
              onPick(b.kind)
            }}
            className={cn(
              "rounded-nested flex w-full items-center gap-2.5 px-2 py-1.5 text-left text-sm",
              i === active && "bg-muted",
            )}
          >
            <b.icon className="text-muted-foreground size-4" />
            {t(b.key as never)}
          </button>
        </Fragment>
      ))}
    </div>
  )
}

function filterBlocks(filter: string, t: (k: never) => string) {
  const needle = filter.trim().toLowerCase()
  if (!needle) return BLOCKS
  const name = (b: (typeof BLOCKS)[number]) => t(b.key as never).toLowerCase()
  // The exact name first ("/teks" → Teks), then names that start with it.
  const rank = (b: (typeof BLOCKS)[number]) =>
    name(b) === needle ? 0 : name(b).startsWith(needle) ? 1 : 2
  return BLOCKS.filter(
    (b) => name(b).includes(needle) || b.kind.includes(needle),
  )
    .map((b, i) => ({ b, i }))
    .sort((x, y) => rank(x.b) - rank(y.b) || x.i - y.i)
    .map((x) => x.b)
}

/** A section: its number and title, its questions, and the "/" line. */
function SectionBlock({
  section,
  number,
  offered,
  canRemove,
  onChange,
  onRemove,
  onInsert,
  children,
}: {
  section: BriefSection
  number: number
  offered: boolean
  canRemove: boolean
  onChange: (change: (s: BriefSection) => BriefSection) => void
  onRemove: () => void
  onInsert: (kind: BlockKind, afterId?: string, label?: string) => void
  children: ReactNode
}) {
  const t = useT("briefs")
  // The note shows once it has text, or after "Keterangan" (no hover pop-in).
  const [noteOpen, setNoteOpen] = useState(false)
  return (
    <section
      className={cn(
        "group/section flex flex-col gap-6",
        offered && "opacity-80",
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className={cn(sectionTitleClass, "tabular-nums")}>
            {number}.
          </span>
          <input
            value={section.title}
            data-focus-key={`section:${section.id}`}
            placeholder={t("sectionTitle")}
            aria-label={t("sectionTitle")}
            onChange={(e) => onChange((s) => ({ ...s, title: e.target.value }))}
            className={cn(
              sectionTitleClass,
              inlineInputClass,
              "min-w-0 flex-1",
            )}
          />
          {section.set !== "common" && (
            <SetIcon
              set={section.set as BriefSet}
              className="shrink-0 self-center"
            />
          )}
          {offered && (
            <Badge variant="secondary" className="self-center">
              {t("setOffer")}
            </Badge>
          )}
          {section.team && (
            <Badge variant="secondary" className="self-center">
              {t("teamFills")}
            </Badge>
          )}
          {!section.description && !noteOpen && (
            <button
              type="button"
              onClick={() => setNoteOpen(true)}
              className="text-muted-foreground hover:bg-muted shrink-0 self-center rounded-full px-2 py-0.5 text-xs opacity-0 transition-opacity group-hover/section:opacity-100 focus-visible:opacity-100"
            >
              {t("addNote")}
            </button>
          )}
          {canRemove && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("removeSection")}
              className="text-muted-foreground hover:text-destructive-ink self-center opacity-0 group-hover/section:opacity-100 focus-visible:opacity-100"
              onClick={onRemove}
            >
              <RiDeleteBinLine />
            </Button>
          )}
        </div>
        {(section.description || noteOpen) && (
          <input
            value={section.description ?? ""}
            autoFocus={noteOpen && !section.description}
            onBlur={() => !section.description && setNoteOpen(false)}
            placeholder={t("sectionDescription")}
            aria-label={t("sectionDescription")}
            onChange={(e) =>
              onChange((s) => ({
                ...s,
                description: e.target.value || undefined,
              }))
            }
            className={cn(questionHelpClass, inlineInputClass)}
          />
        )}
      </div>
      {children}
      <SlashLine
        sectionId={section.id}
        onInsert={(kind, label) => onInsert(kind, undefined, label)}
      />
    </section>
  )
}

/**
 * The line at a section's end: "/" opens the block menu (type to filter,
 * arrows, Enter); typing a question and Enter adds it as a long answer.
 */
function SlashLine({
  sectionId,
  onInsert,
}: {
  sectionId: string
  onInsert: (kind: BlockKind, label?: string) => void
}) {
  const t = useT("briefs")
  const [value, setValue] = useState("")
  const [active, setActive] = useState(0)
  const menu = value.startsWith("/")
  const items = menu ? filterBlocks(value.slice(1), t as never) : []
  const pick = (kind: BlockKind) => {
    setValue("")
    setActive(0)
    onInsert(kind)
  }
  return (
    <div className="relative">
      <div className="text-tertiary-foreground flex items-center gap-2">
        <Plus className="size-4 shrink-0" />
        <input
          value={value}
          data-focus-key={`slash:${sectionId}`}
          placeholder={t("slashHint")}
          aria-label={t("slashHint")}
          onChange={(e) => {
            setValue(e.target.value)
            setActive(0)
          }}
          onBlur={() =>
            window.setTimeout(() => value.startsWith("/") && setValue(""), 150)
          }
          onKeyDown={(e) => {
            if (menu && items.length) {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                setActive((i) => (i + 1) % items.length)
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setActive((i) => (i - 1 + items.length) % items.length)
              } else if (e.key === "Enter") {
                e.preventDefault()
                pick(items[active].kind)
              }
            } else if (e.key === "Enter" && value.trim()) {
              e.preventDefault()
              onInsert("textarea", value.trim())
              setValue("")
            }
            if (e.key === "Escape" && value) {
              e.stopPropagation()
              setValue("")
            }
          }}
          className={cn(
            inlineInputClass,
            "text-foreground text-title min-w-0 flex-1 py-1",
          )}
        />
      </div>
      {menu && (
        <BlockMenu
          filter={value.slice(1)}
          active={active}
          onPick={pick}
          onHover={setActive}
        />
      )}
    </div>
  )
}

/** One question, edited in place, with its gutter (+ and drag handle). */
/** The answers a "show if" can match: a choice question's options. */
function choiceOptions(q: BriefQuestion) {
  if (q.type === "yesno") return ["Yes", "No"]
  if (hasOptions(q.type)) return (q.options ?? []).filter((o) => o.trim())
  return []
}

function QuestionBlock({
  question: q,
  sources,
  condition,
  teamAnswer,
  onAnswer,
  onChange,
  onInsert,
  onDuplicate,
  onRemove,
}: {
  question: BriefQuestion
  /** Earlier choice questions this one can depend on. */
  sources: BriefQuestion[]
  /** The question its "show if" points at. */
  condition?: BriefQuestion
  teamAnswer?: string
  onAnswer: (value: string) => void
  onChange: (patch: Partial<BriefQuestion>) => void
  onInsert: (kind: BlockKind) => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const t = useT("briefs")
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: q.id })
  const [plusOpen, setPlusOpen] = useState(false)
  // The note shows once it has text, or after "Tambah keterangan" in ⋯.
  const [noteOpen, setNoteOpen] = useState(false)
  const choices = hasOptions(q.type)
  const layout = isLayout(q.type)
  const type = BLOCKS.find((b) => b.kind === q.type)!
  const rule = q.showIf
  const toggleRule = (source: string, option: string, on: boolean) => {
    const is = rule?.question === source ? rule.is : []
    const next = on ? [...is, option] : is.filter((o) => o !== option)
    onChange({
      showIf: next.length ? { question: source, is: next } : undefined,
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group/q relative flex flex-col gap-2.5",
        isDragging && "opacity-40",
      )}
    >
      {/* Gutter: add below, drag. */}
      <div className="absolute top-0 -left-14 hidden h-6 items-center gap-0.5 opacity-0 transition-opacity group-focus-within/q:opacity-100 group-hover/q:opacity-100 sm:flex">
        <DropdownMenu open={plusOpen} onOpenChange={setPlusOpen}>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label={t("addQuestion")}
                className="text-muted-foreground hover:bg-muted flex size-6 items-center justify-center rounded-md"
              />
            }
          >
            <Plus className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-96 min-w-52">
            {(["question", "layout"] as const).map((group) => (
              <DropdownMenuGroup key={group}>
                <DropdownMenuLabel>{t(GROUP_KEYS[group])}</DropdownMenuLabel>
                {BLOCKS.filter((b) => b.group === group).map((b) => (
                  <DropdownMenuItem
                    key={b.kind}
                    onClick={() => onInsert(b.kind)}
                  >
                    <b.icon />
                    {t(b.key as never)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label={t("dragQuestion")}
          className="text-muted-foreground hover:bg-muted flex size-6 cursor-grab items-center justify-center rounded-md active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </div>

      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 items-baseline">
          {q.type === "divider" ? (
            <hr className="border-border my-3 flex-1" />
          ) : q.type === "statement" ? (
            <textarea
              value={q.label}
              data-focus-key={`q:${q.id}`}
              rows={1}
              placeholder={t("statementPlaceholder")}
              aria-label={t("blockStatement")}
              onChange={(e) => onChange({ label: e.target.value })}
              className={cn(
                inlineInputClass,
                "text-muted-foreground text-title field-sizing-content min-w-0 flex-1 resize-none leading-relaxed",
              )}
            />
          ) : (
            <input
              value={q.label}
              data-focus-key={`q:${q.id}`}
              placeholder={t("questionLabel")}
              aria-label={t("questionLabel")}
              onChange={(e) => onChange({ label: e.target.value })}
              className={cn(
                questionLabelClass,
                inlineInputClass,
                "min-w-0 flex-1",
              )}
            />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-focus-within/q:opacity-100 group-hover/q:opacity-100">
          {!layout && (
            <button
              type="button"
              aria-pressed={!q.optional}
              onClick={() =>
                onChange({ optional: q.optional ? undefined : true })
              }
              className={cn(
                "h-6 rounded-full px-2 text-xs transition-colors",
                q.optional
                  ? "text-muted-foreground hover:bg-muted"
                  : "bg-muted text-foreground",
              )}
            >
              {q.optional ? t("questionOptional") : t("questionRequired")}
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label={t("questionMenu")}
                  className="text-muted-foreground hover:bg-muted flex size-6 items-center justify-center rounded-md"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              {!layout && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <type.icon />
                    {t(type.key as never)}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={q.type}
                      onValueChange={(v) => {
                        const next = v as QuestionType
                        onChange({
                          type: next,
                          ...(hasOptions(next) && !q.options?.length
                            ? { options: ["", ""] }
                            : {}),
                          ...(next === "scale" ? { max: 10 } : {}),
                          ...(next === "rating" ? { max: 5 } : {}),
                        })
                      }}
                    >
                      {BLOCKS.filter((b) => b.group === "question").map((b) => (
                        <DropdownMenuRadioItem
                          key={b.kind}
                          value={b.kind}
                          closeOnClick
                        >
                          <b.icon />
                          {t(b.key as never)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              {!layout && sources.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Split />
                    {t("showIf")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-80 max-w-72 min-w-56">
                    {sources.map((source) => (
                      <DropdownMenuSub key={source.id}>
                        <DropdownMenuSubTrigger>
                          <span className="min-w-0 truncate">
                            {source.label}
                          </span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="max-w-72 min-w-44">
                          {choiceOptions(source).map((option, i) => (
                            <DropdownMenuCheckboxItem
                              key={`${i}:${option}`}
                              checked={
                                rule?.question === source.id &&
                                rule.is.includes(option)
                              }
                              onCheckedChange={(on) =>
                                toggleRule(source.id, option, on)
                              }
                            >
                              <span className="min-w-0 truncate">{option}</span>
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    ))}
                    {rule && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onChange({ showIf: undefined })}
                        >
                          {t("showAlways")}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              {!layout && !q.help && (
                <DropdownMenuItem onClick={() => setNoteOpen(true)}>
                  <TextQuote />
                  {t("addNote")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy />
                {t("duplicate")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onRemove}>
                <RiDeleteBinLine />
                {t("removeQuestion")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {rule && condition && (
        <div className="text-muted-foreground -mt-1 flex min-w-0 items-center gap-1.5 text-xs">
          <CornerDownRight className="size-3.5 shrink-0" />
          <span className="min-w-0 truncate">
            {t("shownIf", {
              question: condition.label,
              answer: rule.is.join(" / "),
            })}
          </span>
          <button
            type="button"
            aria-label={t("showAlways")}
            onClick={() => onChange({ showIf: undefined })}
            className="hover:bg-muted hover:text-foreground flex size-5 shrink-0 items-center justify-center rounded-md"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {!layout && (q.help || noteOpen) && (
        <input
          value={q.help ?? ""}
          autoFocus={noteOpen && !q.help}
          onBlur={() => !q.help && setNoteOpen(false)}
          placeholder={t("questionHelp")}
          aria-label={t("questionHelp")}
          onChange={(e) => onChange({ help: e.target.value || undefined })}
          className={cn(questionHelpClass, inlineInputClass, "-mt-1.5")}
        />
      )}

      {q.type === "text" &&
        (teamAnswer !== undefined ? (
          <Input
            value={teamAnswer}
            placeholder={t("teamFills")}
            onChange={(e) => onAnswer(e.target.value)}
          />
        ) : (
          <Input
            value={q.example ?? ""}
            placeholder={t("questionExample")}
            aria-label={t("questionExample")}
            onChange={(e) => onChange({ example: e.target.value || undefined })}
            className="text-muted-foreground"
          />
        ))}
      {q.type === "textarea" &&
        (teamAnswer !== undefined ? (
          <Textarea
            value={teamAnswer}
            rows={2}
            placeholder={t("teamFills")}
            onChange={(e) => onAnswer(e.target.value)}
          />
        ) : (
          <Textarea
            value={q.example ?? ""}
            rows={2}
            placeholder={t("questionExample")}
            aria-label={t("questionExample")}
            onChange={(e) => onChange({ example: e.target.value || undefined })}
            className="text-muted-foreground min-h-20"
          />
        ))}
      {choices && (
        <OptionsEditor
          options={q.options ?? []}
          other={Boolean(q.other)}
          multi={q.type === "multi"}
          allowOther={q.type !== "dropdown"}
          teamAnswer={teamAnswer}
          onAnswer={onAnswer}
          onChange={(options) => onChange({ options })}
          onOther={(other) => onChange({ other: other || undefined })}
        />
      )}
      {q.type === "files" && (
        <div className="border-field-border text-muted-foreground flex flex-col items-center gap-1 rounded-2xl border border-dashed px-4 py-6 text-center text-sm">
          <CloudUpload className="size-5" />
          {t("filesPreview")}
        </div>
      )}
      {PREVIEWED.has(q.type) &&
        (teamAnswer !== undefined ? (
          <BriefField
            question={q}
            answers={{ [q.id]: teamAnswer }}
            onChange={(_, v) => typeof v === "string" && onAnswer(v)}
          />
        ) : (
          // The client's field, inert; the block's settings below it.
          <div className="pointer-events-none opacity-80" aria-hidden>
            <BriefField question={q} answers={{}} onChange={() => {}} preview />
          </div>
        ))}
      {q.type === "scale" && (
        <div className="text-meta flex flex-wrap items-center gap-2">
          <ScaleMax
            value={q.max ?? 10}
            options={[5, 10]}
            onChange={(max) => onChange({ max })}
          />
          <Input
            value={q.minLabel ?? ""}
            placeholder={t("scaleMinLabel")}
            aria-label={t("scaleMinLabel")}
            onChange={(e) =>
              onChange({ minLabel: e.target.value || undefined })
            }
            size="sm"
            className="w-40"
          />
          <Input
            value={q.maxLabel ?? ""}
            placeholder={t("scaleMaxLabel")}
            aria-label={t("scaleMaxLabel")}
            onChange={(e) =>
              onChange({ maxLabel: e.target.value || undefined })
            }
            size="sm"
            className="w-40"
          />
        </div>
      )}
      {q.type === "rating" && (
        <ScaleMax
          value={q.max ?? 5}
          options={[3, 5, 7, 10]}
          onChange={(max) => onChange({ max })}
        />
      )}
    </div>
  )
}

/** Field types shown as the client's own field (no inline editor). */
const PREVIEWED = new Set<QuestionType>([
  "yesno",
  "email",
  "phone",
  "url",
  "number",
  "date",
  "scale",
  "rating",
])

/** "1–5 / 1–10" or the number of stars. */
function ScaleMax({
  value,
  options,
  onChange,
}: {
  value: number
  options: number[]
  onChange: (value: number) => void
}) {
  const t = useT("briefs")
  return (
    <div className="text-meta flex items-center gap-1">
      <span className="text-muted-foreground mr-1">{t("scaleMax")}</span>
      {options.map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={value === n}
          onClick={() => onChange(n)}
          className={cn(
            "h-7 min-w-7 rounded-full px-2 tabular-nums transition-colors",
            value === n
              ? "bg-foreground text-background"
              : "bg-muted hover:bg-accent",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

/**
 * Choices as the client sees them (A, B, C…), each text editable in place:
 * Enter adds the next, Backspace on an empty one removes it, the handle
 * on the left reorders them. In a team section a click on the key picks it.
 */
function OptionsEditor({
  options,
  other,
  multi,
  allowOther = true,
  teamAnswer,
  onAnswer,
  onChange,
  onOther,
}: {
  options: string[]
  other: boolean
  multi: boolean
  allowOther?: boolean
  teamAnswer?: string
  onAnswer: (value: string) => void
  onChange: (options: string[]) => void
  onOther: (other: boolean) => void
}) {
  const t = useT("briefs")
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const focusAt = useRef<number | null>(null)
  useEffect(() => {
    if (focusAt.current === null) return
    refs.current[focusAt.current]?.focus()
    focusAt.current = null
  })
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
  )
  const ids = options.map((_, i) => `opt-${i}`)
  const set = (i: number, value: string) =>
    onChange(options.map((o, j) => (j === i ? value : o)))
  const add = (at: number) => {
    const next = [...options]
    next.splice(at, 0, "")
    focusAt.current = at
    onChange(next)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {allowOther && (
        <ChoiceHint
          multi={multi}
          label={t(multi ? "hintMulti" : "hintSingle")}
        />
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return
          const from = ids.indexOf(String(active.id))
          const to = ids.indexOf(String(over.id))
          const next = [...options]
          const [item] = next.splice(from, 1)
          next.splice(to, 0, item)
          onChange(next)
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {options.map((option, i) => (
            <OptionRow
              key={ids[i]}
              id={ids[i]}
              index={i}
              option={option}
              multi={multi}
              picked={
                teamAnswer !== undefined &&
                Boolean(option) &&
                teamAnswer === option
              }
              canPick={teamAnswer !== undefined}
              inputRef={(el) => {
                refs.current[i] = el
              }}
              placeholder={t("optionPlaceholder", { n: i + 1 })}
              onPick={() => onAnswer(teamAnswer === option ? "" : option)}
              onText={(v) => set(i, v)}
              onEnter={() => add(i + 1)}
              onRemove={(focusPrev) => {
                if (focusPrev) focusAt.current = Math.max(0, i - 1)
                onChange(options.filter((_, j) => j !== i))
              }}
              onTidy={() => {
                const kept = options.map((o) => o.trim())
                if (kept.some((o, j) => o !== options[j])) onChange(kept)
              }}
            />
          ))}
        </SortableContext>
      </DndContext>
      {other && allowOther && (
        <div className="border-field-border text-muted-foreground flex h-10 w-fit items-center gap-3 rounded-full border border-dashed py-1.5 pr-4 pl-2 text-sm">
          <ChoiceBadge index={options.length} multi={multi} />
          Other
        </div>
      )}
      <div className="text-meta flex items-center gap-4 pt-0.5">
        <button
          type="button"
          onClick={() => add(options.length)}
          className="text-muted-foreground hover:text-foreground hover:bg-muted flex h-8 items-center gap-1.5 rounded-full px-2.5 transition-colors"
        >
          <Plus className="size-3.5" />
          {t("addOption")}
        </button>
        {allowOther && (
          <label className="text-muted-foreground flex items-center gap-2">
            <Switch checked={other} onCheckedChange={onOther} />
            {t("questionOther")}
          </label>
        )}
      </div>
    </div>
  )
}

/** One editable choice; its handle (left) and remove (right) show on hover. */
function OptionRow({
  id,
  index,
  option,
  multi,
  picked,
  canPick,
  inputRef,
  placeholder,
  onPick,
  onText,
  onEnter,
  onRemove,
  onTidy,
}: {
  id: string
  index: number
  option: string
  multi: boolean
  picked: boolean
  canPick: boolean
  inputRef: (el: HTMLInputElement | null) => void
  placeholder: string
  onPick: () => void
  onText: (value: string) => void
  onEnter: () => void
  onRemove: (focusPrev: boolean) => void
  onTidy: () => void
}) {
  const t = useT("briefs")
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group/opt relative flex max-w-full items-center",
        isDragging && "z-10 opacity-60",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={t("dragQuestion")}
        className="text-muted-foreground hover:bg-muted absolute -left-7 flex size-6 cursor-grab items-center justify-center rounded-md opacity-0 transition-opacity group-hover/opt:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <div
        className={cn(
          // Ringed while typing or tabbing in, not when the badge is clicked.
          "has-[:focus-visible]:ring-focus-ring flex min-h-10 w-fit max-w-full items-center gap-3 rounded-full border py-1.5 pr-4 pl-2 transition-colors has-[:focus-visible]:ring-2",
          picked
            ? "border-foreground bg-foreground text-background"
            : "border-field-border bg-field hover:bg-field-hover",
        )}
      >
        <button
          type="button"
          tabIndex={canPick ? 0 : -1}
          onClick={() => canPick && onPick()}
          className={cn(
            "rounded-full outline-none",
            !canPick && "cursor-default",
          )}
        >
          <ChoiceBadge index={index} multi={multi} selected={picked} />
        </button>
        <input
          ref={inputRef}
          value={option}
          placeholder={placeholder}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              onEnter()
            }
            if (e.key === "Backspace" && !option) {
              e.preventDefault()
              onRemove(true)
            }
          }}
          onBlur={onTidy}
          className={cn(
            inlineInputClass,
            "field-sizing-content max-w-md min-w-28 text-sm",
          )}
        />
      </div>
      <button
        type="button"
        aria-label={t("removeOption")}
        onClick={() => onRemove(false)}
        className="text-muted-foreground hover:text-foreground hover:bg-muted ml-1 flex size-7 items-center justify-center rounded-full opacity-0 transition-opacity group-hover/opt:opacity-100 focus-visible:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
