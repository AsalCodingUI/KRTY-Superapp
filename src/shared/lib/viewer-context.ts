import type { AccessLevel } from "@/shared/config/access"

/**
 * Who is viewing, as middleware worked it out for this request: pages read
 * it instead of looking the same profiles up again. Middleware drops any
 * copy a client sends and sets it only after checking the session, so a
 * page can trust it (viewer-context-server.ts still matches it to the
 * signed-in user).
 */
export const VIEWER_HEADER = "x-krt-viewer"

export type ViewerContext = {
  authUserId: string
  canonicalUserId: string
  effectiveUserId: string
  isSuperAdmin: boolean
  level: AccessLevel
}

export function encodeViewer(viewer: ViewerContext) {
  return JSON.stringify(viewer)
}

export function decodeViewer(value: string | null | undefined) {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as ViewerContext
    if (
      typeof parsed?.authUserId !== "string" ||
      typeof parsed.canonicalUserId !== "string" ||
      typeof parsed.effectiveUserId !== "string" ||
      !parsed.level
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}
