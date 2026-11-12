"use client"

import {
  useNotificationSoundOnArrival,
  useNotificationsRealtime,
} from "@/shared/hooks/useNotifications"

/**
 * New notifications as they come (realtime, and the poll as a fallback)
 * and their sound, once for the whole app. Mounted in the (main) layout,
 * not in each bell: the sidebar's and the phone bar's bells both being
 * mounted made two subscribers on one channel, and one leaving closed it.
 */
export function NotificationsLive() {
  useNotificationsRealtime()
  useNotificationSoundOnArrival()
  return null
}
