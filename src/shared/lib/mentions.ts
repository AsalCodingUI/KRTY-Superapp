/**
 * @mentions in documents (reports, notes, task descriptions, rules).
 *
 * In Markdown a mention is an ordinary link with its own scheme, so any
 * Markdown reader still shows its label:
 *
 *   person  `[@Farah Intan](mention://person/<profile-uuid>)`
 *   task    `[#Desain homepage](mention://task/<project-uuid>/<task-uuid>)`
 *
 * The label is the name as it was when mentioned (the app shows the current
 * one when it can). Client pages get the label only: `clientSafeMentions`
 * cuts the ids, leaving `(mention://person)` / `(mention://task)`, which
 * read as plain, non-clickable pills. The notification trigger
 * (migrations/report_mentions_notify.sql) reads the same person links.
 */

export type MentionKind = "person" | "task"

export type MentionRef = {
  kind: MentionKind
  /** Profile id (person) or task id (task); null once cut for clients. */
  id: string | null
  /** The task's project; null for people. */
  projectId: string | null
}

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"

export const MENTION_SCHEME = "mention://"

const HREF_RE = new RegExp(
  `^mention://(?:(person)(?:/(${UUID}))?|(task)(?:/(${UUID})/(${UUID}))?)$`,
)

/** The link a mention is stored as. */
export function mentionHref(ref: MentionRef) {
  if (ref.kind === "person")
    return ref.id ? `mention://person/${ref.id}` : "mention://person"
  return ref.id && ref.projectId
    ? `mention://task/${ref.projectId}/${ref.id}`
    : "mention://task"
}

/** A mention link read back, or null when the href isn't one. */
export function parseMentionHref(
  href: string | null | undefined,
): MentionRef | null {
  const m = href ? HREF_RE.exec(href) : null
  if (!m) return null
  if (m[1]) return { kind: "person", id: m[2] ?? null, projectId: null }
  return { kind: "task", id: m[5] ?? null, projectId: m[4] ?? null }
}

/** "@" for people, "#" for tasks: the label's prefix in Markdown. */
export const mentionPrefix = (kind: MentionKind) =>
  kind === "person" ? "@" : "#"

/** Brackets and backslashes in a label would end the link early. */
export const escapeMentionLabel = (s: string) => s.replace(/([\\[\]])/g, "\\$1")
export const unescapeMentionLabel = (s: string) => s.replace(/\\(.)/g, "$1")

/** One mention at the start of `src`: `[@label](mention://…)`. */
export const MENTION_MD = new RegExp(
  `^\\[([@#])((?:\\\\.|[^\\\\\\]\\n])*)\\]\\((mention://(?:person|task)(?:/${UUID}){0,2})\\)`,
)
/** Where the next mention might start in `src`. */
export const MENTION_MD_START = /\[[@#](?:\\.|[^\\\]\n])*\]\(mention:\/\//

/** The Markdown for one mention. */
export function mentionMarkdown(ref: MentionRef, label: string) {
  return `[${mentionPrefix(ref.kind)}${escapeMentionLabel(label)}](${mentionHref(ref)})`
}

/** Mentions with their ids cut: what a client may see is the label. */
export function clientSafeMentions(markdown: string) {
  return markdown.replace(
    new RegExp(`\\]\\(mention://(person|task)(?:/${UUID}){1,2}\\)`, "g"),
    "](mention://$1)",
  )
}
