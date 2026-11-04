"use client"

/**
 * The sound a new notification makes, picked in Settings → Notifikasi and
 * kept on this device. The web app plays it itself (like Discord in a
 * browser); Kretya Flow for Mac hands it to macOS with the notification, so
 * there the web side stays quiet (no double sound). The Windows app's toasts
 * stay silent (Windows can't play our files) and the page plays it.
 */

export const NOTIFICATION_SOUNDS = [
  "kretya",
  "chime",
  "system",
  "none",
] as const
export type NotificationSound = (typeof NOTIFICATION_SOUNDS)[number]

const KEY = "krty-notification-sound"
const DEFAULT: NotificationSound = "kretya"

/** The files: /public/sounds for the web, bundled in the app for macOS. */
const FILES: Partial<Record<NotificationSound, string>> = {
  kretya: "/sounds/kretya.mp3",
  chime: "/sounds/chime.mp3",
}
/** The names macOS knows them by (Contents/Resources of Kretya Flow). */
const APP_SOUNDS: Partial<Record<NotificationSound, string>> = {
  kretya: "kretya.aiff",
  chime: "kretya-chime.aiff",
  system: "default",
  none: "none",
}

export function notificationSound(): NotificationSound {
  try {
    const v = localStorage.getItem(KEY) as NotificationSound | null
    if (v && (NOTIFICATION_SOUNDS as readonly string[]).includes(v)) return v
  } catch {}
  return DEFAULT
}

export function setNotificationSound(value: NotificationSound) {
  try {
    localStorage.setItem(KEY, value)
  } catch {}
}

/** What Kretya Flow's `notify` gets as its `sound`. */
export const appSoundName = (value = notificationSound()) =>
  APP_SOUNDS[value] ?? "default"

/** Can it be heard in a browser (macOS's own sound can't). */
export const playable = (value: NotificationSound) => Boolean(FILES[value])

let lastAt = 0

/** Plays it (a preview, or a new notification). `once` keys a
 *  notification: several tabs open, or a burst, still sound once. */
export function playNotificationSound(
  value: NotificationSound = notificationSound(),
  once?: string,
) {
  const file = FILES[value]
  if (!file) return
  if (once) {
    const now = Date.now()
    if (now - lastAt < 1500) return
    try {
      const key = `krty-sound:${once}`
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, String(now))
      setTimeout(() => localStorage.removeItem(key), 60_000)
    } catch {}
    lastAt = now
  }
  try {
    const audio = new Audio(file)
    audio.volume = 0.7
    // A browser may refuse until the page has been clicked once.
    void audio.play().catch(() => {})
  } catch {}
}
