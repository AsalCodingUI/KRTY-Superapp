"use client"

import { ProjectStageIcon } from "@/page-slices/projects/ui/ProjectStageIcon"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import {
  answerText,
  fileSize,
  visibleSections,
} from "@/shared/lib/briefs/brief"
import {
  isLayout,
  type BriefSet,
  type BriefStatus,
} from "@/shared/lib/briefs/types"
import { Download, FileIcon } from "lucide-react"
import type { BriefListRow } from "../model/data"

export const SET_LABEL_KEYS = {
  design: "setDesign",
  branding: "setBranding",
  development: "setDevelopment",
} as const satisfies Record<BriefSet, string>

export const STATUS_LABEL_KEYS = {
  draft: "statusDraft",
  sent: "statusSent",
  in_progress: "statusInProgress",
  submitted: "statusSubmitted",
} as const satisfies Record<BriefStatus, string>

/** The sets share the project stages' glyphs (UI Design, Branding, Dev). */
export function SetIcon({
  set,
  className,
}: {
  set: BriefSet
  className?: string
}) {
  return <ProjectStageIcon stage={set} className={className} />
}

/** The sets a brief asks, as small icon + name chips. */
export function SetChips({
  sets,
  className,
}: {
  sets: string[]
  className?: string
}) {
  const t = useT("briefs")
  return (
    <span
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}
    >
      {(sets as BriefSet[])
        .filter((s) => s in SET_LABEL_KEYS)
        .map((set) => (
          <span
            key={set}
            className="text-muted-foreground inline-flex items-center gap-1.5 text-[13px]"
          >
            <SetIcon set={set} className="size-3.5" />
            {t(SET_LABEL_KEYS[set])}
          </span>
        ))}
    </span>
  )
}

/** A dot per status: grey draft, blue sent, amber in progress, green in. */
export function BriefStatusDot({ status }: { status: BriefStatus }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2 shrink-0 rounded-full",
        status === "draft" && "bg-muted-foreground/50",
        status === "sent" && "bg-primary",
        status === "in_progress" && "bg-warning",
        status === "submitted" && "bg-success",
      )}
    />
  )
}

/**
 * The answers as the client gave them, easy to read through: the sections
 * down the left (how many answered, a click jumps there), and on the right
 * a card per section with one row per question (the question left, the
 * answer right; "—" when there's none yet).
 */
export function BriefAnswersView({ brief }: { brief: BriefListRow }) {
  const t = useT("briefs")
  const sections = visibleSections(brief.sections, brief.sets, {
    answers: brief.answers,
  })
  const asked = (s: (typeof sections)[number]) =>
    s.questions.filter((q) => !isLayout(q.type))
  const answered = (s: (typeof sections)[number]) =>
    asked(s).filter((q) =>
      q.type === "files"
        ? brief.files.some((f) => f.question_id === q.id)
        : answerText(q, brief.answers).length > 0,
    ).length
  const jump = (id: string) =>
    document
      .getElementById(`ans-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <div className="flex min-h-0 flex-1">
      <nav className="border-border scroll-pane pane-px-3 hidden w-60 shrink-0 flex-col gap-0.5 border-r py-3 md:flex">
        {sections.map((section, index) => {
          const done = answered(section)
          const total = asked(section).length
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => jump(section.id)}
              className="hover:bg-muted flex items-start gap-2.5 rounded-xl px-3.5 py-2 text-left text-[13px] transition-colors"
            >
              <span className="text-tertiary-foreground w-4 shrink-0 tabular-nums">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 leading-snug">
                {section.title}
              </span>
              <span
                className={cn(
                  "shrink-0 tabular-nums",
                  done === total
                    ? "text-muted-foreground"
                    : "text-tertiary-foreground",
                )}
              >
                {done}/{total}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="scroll-pane pane-px-4 sm:pane-px-5 min-h-0 flex-1 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={`ans-${section.id}`}
              className="border-border scroll-mt-4 rounded-2xl border"
            >
              <header className="border-border flex items-start gap-2 border-b px-4 py-3">
                <span className="text-tertiary-foreground text-sm leading-5 tabular-nums">
                  {index + 1}
                </span>
                <h3 className="min-w-0 flex-1 text-sm leading-5 font-medium">
                  {section.title}
                </h3>
                {section.team && (
                  <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-[11px]">
                    {t("teamFills")}
                  </span>
                )}
                <span className="text-tertiary-foreground shrink-0 text-xs tabular-nums">
                  {answered(section)}/{asked(section).length}
                </span>
              </header>
              <dl className="divide-border divide-y">
                {section.questions.map((q) => {
                  if (q.type === "divider") return null
                  if (q.type === "statement")
                    return (
                      <p
                        key={q.id}
                        className="text-muted-foreground px-4 py-2.5 text-[13px] whitespace-pre-wrap"
                      >
                        {q.label}
                      </p>
                    )
                  const files = brief.files.filter(
                    (f) => f.question_id === q.id,
                  )
                  const values =
                    q.type === "files" ? [] : answerText(q, brief.answers)
                  // Long answers read better under the question, full width.
                  const stacked =
                    q.type === "textarea" ||
                    values.some((v) => v.length > 80 || v.includes("\n"))
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "grid gap-1 px-4 py-2.5",
                        stacked && "gap-1.5",
                        !stacked &&
                          "sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6",
                      )}
                    >
                      <dt className="text-muted-foreground text-[13px] leading-relaxed">
                        {q.label}
                      </dt>
                      <dd className="min-w-0 text-sm leading-relaxed [overflow-wrap:anywhere]">
                        {q.type === "files" ? (
                          files.length ? (
                            <div className="flex flex-col gap-1.5">
                              {files.map((f) => (
                                <a
                                  key={f.id}
                                  href={`/api/briefs/files/${f.id}?download=1`}
                                  className="hover:bg-muted -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1 transition-colors"
                                >
                                  <FileIcon className="text-muted-foreground size-4 shrink-0" />
                                  <span className="min-w-0 flex-1 truncate">
                                    {f.name}
                                  </span>
                                  <span className="text-tertiary-foreground shrink-0 text-xs tabular-nums">
                                    {fileSize(f.file_size)}
                                  </span>
                                  <Download className="text-muted-foreground size-3.5 shrink-0" />
                                </a>
                              ))}
                              {brief.project_id && (
                                <p className="text-tertiary-foreground text-xs">
                                  {t("filesInLibrary")}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-tertiary-foreground">—</span>
                          )
                        ) : values.length === 0 ? (
                          <span className="text-tertiary-foreground">—</span>
                        ) : q.type === "multi" ? (
                          <ul className="flex flex-col gap-1">
                            {values.map((v) => (
                              <li key={v} className="flex gap-2">
                                <span className="text-tertiary-foreground">
                                  •
                                </span>
                                {v}
                              </li>
                            ))}
                          </ul>
                        ) : q.type === "url" &&
                          /^https?:\/\//.test(values[0]) ? (
                          <a
                            href={values[0]}
                            target="_blank"
                            rel="noreferrer"
                            className="decoration-foreground/25 hover:decoration-foreground underline underline-offset-2"
                          >
                            {values[0]}
                          </a>
                        ) : (
                          <p className="max-w-[68ch] whitespace-pre-wrap">
                            {values.join("\n")}
                          </p>
                        )}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
