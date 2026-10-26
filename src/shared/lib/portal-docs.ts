/** Document statuses a client sees in the portal: drafts stay inside. */
export const CLIENT_DOC_STATUSES = ["sent", "approved", "signed"]

/** The readable part of a portal link: the project's name. */
export function portalSlug(projectName: string) {
  return (
    projectName
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/g, "") || "project"
  )
}

/**
 * A portal's link key, `<project-name>-<code>` (e.g. `milxa-jjahvq`). Only
 * the code opens the portal; a stale name (the project was renamed) is
 * corrected by a redirect.
 */
export function portalKey(projectName: string, code: string) {
  return `${portalSlug(projectName)}-${code}`
}

/** The code at the end of a link key (`milxa-jjahvq` → `jjahvq`). */
export function portalCodeOf(key: string) {
  return /(?:^|-)([a-z0-9]{6})$/.exec(key)?.[1] ?? null
}
