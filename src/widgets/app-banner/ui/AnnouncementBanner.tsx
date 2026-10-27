"use client"

import {
  URGENT_NOTIFICATION_TYPES,
  useNotifications,
} from "@/shared/hooks/useNotifications"
import { useT } from "@/shared/i18n/client"
import Link from "next/link"
import { AppBanner } from "./AppBanner"

/** Notification types that also show as a banner until read: a new rule,
 *  and an admin's urgent announcement. */
const BANNER_TYPES = new Set(["policy", ...URGENT_NOTIFICATION_TYPES])

/**
 * Team announcements in the chrome banner: the newest unread one (e.g. "Aturan
 * baru · Cuti 2027" when a rule is published with "notify everyone", or an
 * admin's urgent announcement).
 * Reading it or closing the banner marks it read, along with any older
 * unread ones queued behind it (they're superseded), so the banner and the
 * bell stay in step and closing it doesn't just reveal the next one.
 */
export function AnnouncementBanner() {
  const { notifications, markAsRead } = useNotifications()
  const t = useT("shell")

  const queued = notifications.filter(
    (n) => !n.is_read && n.type && BANNER_TYPES.has(n.type),
  )
  const latest = queued[0]
  if (!latest) return null
  const dismiss = () => {
    for (const n of queued) void markAsRead(n.id)
  }

  return (
    <AppBanner
      tone="info"
      onClose={dismiss}
      action={
        latest.link ? (
          <Link
            href={latest.link}
            prefetch={false}
            onClick={dismiss}
            className="flex shrink-0 items-center rounded-md px-2 py-1 text-sm font-medium hover:bg-current/10"
          >
            {t("announcementRead")}
          </Link>
        ) : undefined
      }
    >
      <strong className="font-semibold">{latest.title}</strong>
      {latest.message && (
        <span className="opacity-80"> · {latest.message}</span>
      )}
    </AppBanner>
  )
}
