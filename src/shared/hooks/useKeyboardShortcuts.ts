import type { ViewMode } from '@/widgets/event-calendar'
import { useEffect } from "react"

interface KeyboardShortcutHandlers {
  onCreateEvent: () => void
  onGoToday: () => void
  onPrevious: () => void
  onNext: () => void
  onViewChange: (view: ViewMode) => void
}

/**
 * Keyboard shortcuts for calendar navigation and actions
 *
 * Shortcuts:
 * - C or N: Create new event
 * - T: Go to today
 * - ← / →: Previous/Next period
 * - D: Day view
 * - W: Week view
 * - M: Month view
 * - A: Agenda view
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      // Ignore if modifier keys are pressed (except for arrow keys)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return
      }

      const key = e.key.toLowerCase()

      switch (key) {
        case "c":
        case "n":
          e.preventDefault()
          handlers.onCreateEvent()
          break

        case "t":
          e.preventDefault()
          handlers.onGoToday()
          break

        case "arrowleft":
          e.preventDefault()
          handlers.onPrevious()
          break

        case "arrowright":
          e.preventDefault()
          handlers.onNext()
          break

        case "d":
          e.preventDefault()
          handlers.onViewChange("day")
          break

        case "w":
          e.preventDefault()
          handlers.onViewChange("week")
          break

        case "m":
          e.preventDefault()
          handlers.onViewChange("month")
          break

        case "a":
          e.preventDefault()
          handlers.onViewChange("agenda")
          break

        default:
          // No action for other keys
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handlers])
}
