import type { AccessLevel } from "@/shared/config/access"
import type { WhatsNewAudience } from "./types"

/** Whether a viewer at `level` is who an entry (or section) is for. */
export function isFor(
  audience: WhatsNewAudience | undefined,
  level: AccessLevel,
) {
  if (!audience || audience === "everyone") return true
  if (audience === "pm") return level === "pm" || level === "stakeholder"
  return level === "stakeholder"
}
