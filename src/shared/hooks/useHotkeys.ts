import { useCallback, useEffect } from "react"

type KeyHandler = (event: KeyboardEvent) => void
type KeyConfig = {
  key: string
  handler: KeyHandler
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
  enabled?: boolean
}

/**
 * Custom hook for handling keyboard shortcuts.
 * Provides a clean API for registering multiple keyboard shortcuts.
 *
 * @param shortcuts - Array of shortcut configurations
 *
 * @example
 * ```tsx
 * useHotkeys([
 *   { key: "k", ctrl: true, handler: () => openCommandBar() },
 *   { key: "Escape", handler: () => closeModal() },
 *   { key: "d", handler: handleDelete, enabled: hasSelection },
 * ])
 * ```
 */
export function useHotkeys(shortcuts: KeyConfig[]): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue

        const keyMatches =
          event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey
        const altMatches = shortcut.alt ? event.altKey : !event.altKey
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey

        if (keyMatches && ctrlMatches && altMatches && shiftMatches) {
          event.preventDefault()
          shortcut.handler(event)
          break
        }
      }
    },
    [shortcuts],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Simplified hook for a single keyboard shortcut.
 *
 * @param key - The key to listen for
 * @param handler - Callback when key is pressed
 * @param options - Optional modifier keys and enabled state
 *
 * @example
 * ```tsx
 * useHotkey("Escape", () => closeModal())
 * useHotkey("s", () => save(), { ctrl: true })
 * ```
 */
export function useHotkey(
  key: string,
  handler: KeyHandler,
  options?: {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    meta?: boolean
    enabled?: boolean
  },
): void {
  useHotkeys([{ key, handler, ...options }])
}

/**
 * Hook for detecting clicks outside of an element.
 * Useful for closing dropdowns, modals, etc.
 *
 * @param ref - React ref to the element
 * @param handler - Callback when clicking outside
 *
 * @example
 * ```tsx
 * const dropdownRef = useRef<HTMLDivElement>(null)
 * useClickOutside(dropdownRef, () => setIsOpen(false))
 * ```
 */
export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
}
