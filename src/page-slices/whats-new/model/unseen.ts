"use client"

import { accessLevel } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useMemo } from "react"
import { isFor } from "./audience"
import { useWhatsNewMeta } from "./data"
import { isGuide } from "./types"
import { unseenOf, useLastSeen } from "./seen"

const WEEK = 7 * 24 * 60 * 60 * 1000

/**
 * What the viewer hasn't seen yet (published updates for them, not guides): `count`,
 * `areas` they touch, `thisWeek` when all came out in the last 7 days. Zero
 * until everything is known (no flash of the notice on load).
 */
export function useWhatsNewUnseen() {
  const { profile } = useUserProfile()
  const [lastSeen] = useLastSeen(profile?.id)
  const { data: meta } = useWhatsNewMeta(Boolean(profile))
  return useMemo(() => {
    if (!profile || !meta || lastSeen === undefined)
      return { count: 0, areas: 0, thisWeek: false, latestId: null }
    const level = accessLevel(profile)
    // Guides aren't news: they never raise the notice.
    const published = meta.filter((e) => e.published && !isGuide(e))
    const visible = published.filter((e) => isFor(e.audience, level))
    const unseen = unseenOf(published, visible, lastSeen)
    const since = Date.now() - WEEK
    return {
      count: unseen.length,
      /** How many areas they touch: a long list reads as "Update di 9
       *  bagian" on the card instead of "25 update". */
      areas: new Set(unseen.map((e) => e.area)).size,
      /** The newest entry the viewer sees: "seen" up to here. */
      latestId: visible[0]?.id ?? null,
      thisWeek: unseen.every(
        (e) => new Date(`${e.date}T23:59:59+07:00`).getTime() >= since,
      ),
    }
  }, [profile, meta, lastSeen])
}
