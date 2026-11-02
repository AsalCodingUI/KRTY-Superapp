"use client"

import type { SidebarNotice } from "@/components/sidebar-notices"
import { siteConfig } from "@/app/siteConfig"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { Sparkles } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useLastSeen } from "../model/seen"
import { useWhatsNewUnseen } from "../model/unseen"

const HREF = siteConfig.baseLinks.whatsNew
const FEW = 4

/**
 * "Ada yang baru · 3 update minggu ini" at the bottom of the sidebar until
 * the viewer opens Yang baru (or hides the card, which counts as seen).
 */
export function useWhatsNewNotice(priority: number): SidebarNotice | null {
  const t = useT("whatsNew")
  const router = useRouter()
  const pathname = usePathname()
  const { profile } = useUserProfile()
  const [, markSeen] = useLastSeen(profile?.id)
  const { count, areas, thisWeek, latestId } = useWhatsNewUnseen()
  const here = pathname === HREF || pathname.startsWith(`${HREF}/`)
  if (!count || here || !latestId) return null
  return {
    id: "whats-new",
    priority,
    title: t("noticeTitle"),
    // A few: "3 update minggu ini"; many: grouped by area so it fits.
    subtitle:
      count > FEW
        ? t("noticeAreas", { n: areas })
        : t(thisWeek ? "noticeWeek" : "noticeMore", { n: count }),
    icon: <Sparkles />,
    actionLabel: t("noticeAction"),
    onClick: () => router.push(HREF),
    onDismiss: () => markSeen(latestId),
  }
}
