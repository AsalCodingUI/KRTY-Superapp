"use client"

import { useSyncExternalStore } from "react"

/**
 * This browser's display choices beside the theme and the chrome color:
 * text size (the root font size, so everything in rem follows) and a dark
 * sidebar and top bar in light mode (data-dark-chrome on <html>, plus
 * .dark on those two). Applied before first paint by DISPLAY_SCRIPT, then
 * live from Settings → Tampilan.
 */
import {
  DARK_CHROME_KEY,
  DISPLAY_EVENT as EVENT,
  FONT_PX,
  TEXT_KEY,
  TEXT_SIZES,
  type TextSize,
} from "./display-prefs-script"

export { TEXT_SIZES, type TextSize }

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage blocked: lasts for this visit.
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

export function useTextSize() {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(TEXT_KEY),
    () => null,
  )
  const size: TextSize = (TEXT_SIZES as readonly string[]).includes(raw ?? "")
    ? (raw as TextSize)
    : "regular"
  const set = (next: TextSize) => {
    document.documentElement.style.fontSize =
      next === "regular" ? "" : `${FONT_PX[next]}px`
    write(TEXT_KEY, next === "regular" ? null : next)
  }
  return [size, set] as const
}

export function useDarkChrome() {
  const on = useSyncExternalStore(
    subscribe,
    () => read(DARK_CHROME_KEY) === "1",
    () => false,
  )
  const set = (next: boolean) => {
    document.documentElement.toggleAttribute("data-dark-chrome", next)
    write(DARK_CHROME_KEY, next ? "1" : null)
  }
  return [on, set] as const
}
