"use client"

import { accessLevel } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import { useEffect, useMemo } from "react"
import { isFor } from "./audience"
import { useWhatsNewEntries } from "./data"
import { useLastSeen, useReadEntries } from "./seen"
import { isGuide } from "./types"

/**
 * The entries this viewer gets (by access level; drafts for stakeholders),
 * their read state, and "seen": opening any Yang baru page clears the
 * sidebar dot and card.
 */
export function useWhatsNew() {
  const { profile, loading } = useUserProfile()
  const level = accessLevel(profile)
  const canEdit = canManageByRole(profile?.role)
  const query = useWhatsNewEntries(Boolean(profile))
  const entries = useMemo(
    () => (query.data ?? []).filter((e) => isFor(e.audience, level)),
    [query.data, level],
  )
  const userId = profile?.id
  const [, markSeen] = useLastSeen(userId)
  const { ids: readIds, setRead } = useReadEntries(userId)
  const read = useMemo(() => new Set(readIds), [readIds])

  // The marker is the newest update (guides don't count, like the notice).
  const latest = entries.find((e) => e.published && !isGuide(e))?.id
  useEffect(() => {
    if (userId && latest) markSeen(latest)
  }, [userId, latest, markSeen])

  return {
    ready: !loading && Boolean(profile) && !query.isLoading,
    error: query.error,
    level,
    canEdit,
    entries,
    read,
    setRead,
  }
}
