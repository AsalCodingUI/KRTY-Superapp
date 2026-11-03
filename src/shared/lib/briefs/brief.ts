import {
  isLayout,
  type BriefAnswers,
  type BriefQuestion,
  type BriefSection,
  type BriefSet,
} from "./types"

export type BriefFileRef = {
  id: string
  name: string
  file_size: number
  question_id: string | null
}

/**
 * The sections the client answers: the common ones and the sets taken (an
 * offer's questions wait until the client says yes). Questions still being
 * written (no text) and empty choices are left out, unless `drafts` (the
 * builder).
 */
export function visibleSections(
  sections: BriefSection[],
  sets: string[],
  {
    drafts = false,
    answers,
  }: {
    drafts?: boolean
    /** Leaves out questions whose "show if" isn't met by these answers. */
    answers?: BriefAnswers
  } = {},
) {
  const shown = sections.filter(
    (s) => s.set === "common" || sets.includes(s.set as BriefSet),
  )
  if (drafts) return shown
  const ids = new Set(sections.flatMap((s) => s.questions.map((q) => q.id)))
  return shown
    .map((s) => ({
      ...s,
      questions: s.questions
        // A divider has no text; anything else does once it's written.
        .filter((q) => q.type === "divider" || q.label.trim())
        .filter((q) => !answers || conditionMet(q, answers, ids))
        .map((q) =>
          q.options ? { ...q, options: q.options.filter((o) => o.trim()) } : q,
        ),
    }))
    .filter((s) => s.questions.length > 0)
}

/** Whether a question with a "show if" is asked, given the answers so far
 *  (one pointing at a question that's gone is always asked). */
export function conditionMet(
  question: BriefQuestion,
  answers: BriefAnswers,
  ids?: Set<string>,
) {
  const rule = question.showIf
  if (!rule?.question || !rule.is.length) return true
  if (ids && !ids.has(rule.question)) return true
  const value = answers[rule.question]
  const picked = Array.isArray(value) ? value : value ? [value] : []
  return picked.some((v) => rule.is.includes(v))
}

/** A question's answer as text lists (choices with "Other" spelled out). */
export function answerValues(
  question: BriefQuestion,
  answers: BriefAnswers,
): string[] {
  const value = answers[question.id]
  const other = answers[`${question.id}__other`]
  const list = (Array.isArray(value) ? value : value ? [value] : [])
    .map((v) => v.trim())
    .filter(Boolean)
  const otherText = typeof other === "string" ? other.trim() : ""
  if (question.other && otherText)
    return [...list.filter((v) => v !== "Other"), `Other: ${otherText}`]
  return list
}

/** An answer as people read it: "4 / 5" for a rating or a scale. */
export function answerText(question: BriefQuestion, answers: BriefAnswers) {
  const values = answerValues(question, answers)
  if ((question.type === "scale" || question.type === "rating") && values[0])
    return [`${values[0]} / ${question.max ?? (question.type === "scale" ? 10 : 5)}`]
  return values
}

export function isAnswered(
  question: BriefQuestion,
  answers: BriefAnswers,
  files: BriefFileRef[],
) {
  if (question.type === "files")
    return files.some((f) => f.question_id === question.id)
  return answerValues(question, answers).length > 0
}

/** Answered / asked, over the sections the client sees. */
export function briefProgress(
  sections: BriefSection[],
  sets: string[],
  answers: BriefAnswers,
  files: BriefFileRef[],
) {
  const questions = visibleSections(sections, sets, { answers })
    .flatMap((s) => s.questions)
    .filter((q) => !isLayout(q.type))
  return {
    answered: questions.filter((q) => isAnswered(q, answers, files)).length,
    total: questions.length,
    /** Required ones still empty (blocks submitting). */
    missing: questions.filter(
      (q) => !q.optional && !isAnswered(q, answers, files),
    ),
  }
}

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

/**
 * The brief as Markdown: every question with its answer under it (an
 * empty one says so), section by section.
 */
export function briefMarkdown({
  title,
  client,
  sections,
  sets,
  answers,
  files,
}: {
  title: string
  client?: string | null
  sections: BriefSection[]
  sets: string[]
  answers: BriefAnswers
  files: BriefFileRef[]
}) {
  const lines: string[] = [`# ${title}`]
  if (client) lines.push("", `Client: ${client}`)
  for (const section of visibleSections(sections, sets, { answers })) {
    lines.push("", `## ${section.title}`)
    for (const q of section.questions) {
      if (q.type === "divider") {
        lines.push("", "---")
        continue
      }
      if (q.type === "statement") {
        lines.push("", q.label)
        continue
      }
      lines.push("", `**${q.label}**`, "")
      if (q.type === "files") {
        const mine = files.filter((f) => f.question_id === q.id)
        lines.push(
          mine.length
            ? mine
                .map((f) => `- ${f.name} (${fileSize(f.file_size)})`)
                .join("\n")
            : "_No files_",
        )
        continue
      }
      const values = answerText(q, answers)
      if (!values.length) lines.push("_No answer_")
      else if (q.type === "multi")
        lines.push(values.map((v) => `- ${v}`).join("\n"))
      else lines.push(values.join("\n"))
    }
  }
  return `${lines.join("\n")}\n`
}
