"use client"

import { getEventTypeDefinition } from "../../lib/event-color-registry"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type {
  CalendarEvent,
  EventCategory,
  EventVisibilityContextValue,
} from "../types"

const EventVisibilityContext = createContext<
  EventVisibilityContextValue | undefined
>(undefined)

interface EventVisibilityProviderProps {
  children: ReactNode
  initialCategories?: EventCategory[]
}

/** The registry value of an event's type (aliases resolved). */
export const eventTypeOf = (event: CalendarEvent) =>
  getEventTypeDefinition(event.type)?.value ?? event.type

/**
 * Category filter: one checkbox per event type. Only the hidden ids live in
 * state; names and the list itself come fresh from the caller (translated,
 * and different per calendar).
 */
export function EventVisibilityProvider({
  children,
  initialCategories = [],
}: EventVisibilityProviderProps) {
  // Already provided higher up: reuse that state.
  const parent = useContext(EventVisibilityContext)
  const [hidden, setHidden] = useState<Set<string>>(
    () =>
      new Set(initialCategories.filter((c) => !c.isActive).map((c) => c.id)),
  )

  const toggleCategory = useCallback((id: string) => {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // A type no category controls (e.g. Google events) can't be hidden.
  const isEventVisible = useCallback(
    (event: CalendarEvent) => {
      const type = eventTypeOf(event)
      return !type || !hidden.has(type)
    },
    [hidden],
  )

  const categories = useMemo(
    () => initialCategories.map((c) => ({ ...c, isActive: !hidden.has(c.id) })),
    [initialCategories, hidden],
  )

  const value: EventVisibilityContextValue = {
    toggleCategory,
    isEventVisible,
    categories,
  }

  if (parent) return <>{children}</>

  return (
    <EventVisibilityContext.Provider value={value}>
      {children}
    </EventVisibilityContext.Provider>
  )
}

export function useEventVisibility() {
  const context = useContext(EventVisibilityContext)
  if (!context) {
    throw new Error(
      "useEventVisibility must be used within EventVisibilityProvider",
    )
  }
  return context
}
