"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type {
  EventCategory,
  EventColor,
  EventVisibilityContextValue,
} from "../types"

const EventVisibilityContext = createContext<
  EventVisibilityContextValue | undefined
>(undefined)

interface EventVisibilityProviderProps {
  children: ReactNode
  initialCategories?: EventCategory[]
}

export function EventVisibilityProvider({
  children,
  initialCategories = [],
}: EventVisibilityProviderProps) {
  // Already provided higher up (e.g. the page also renders the filter
  // menu): reuse that state instead of starting a second one.
  const parent = useContext(EventVisibilityContext)
  const [categories, setCategories] =
    useState<EventCategory[]>(initialCategories)
  const [visibleColors, setVisibleColors] = useState<Set<EventColor>>(
    new Set(initialCategories.filter((c) => c.isActive).map((c) => c.color)),
  )

  const toggleColor = useCallback((color: EventColor) => {
    setVisibleColors((prev) => {
      const next = new Set(prev)
      if (next.has(color)) {
        next.delete(color)
      } else {
        next.add(color)
      }
      return next
    })

    setCategories((prev) =>
      prev.map((cat) =>
        cat.color === color ? { ...cat, isActive: !cat.isActive } : cat,
      ),
    )
  }, [])

  const isColorVisible = useCallback(
    (color: EventColor) =>
      visibleColors.has(color) ||
      // A colour no category controls can't be hidden by the filter, so it
      // must stay visible (it used to disappear silently).
      !categories.some((category) => category.color === color),
    [visibleColors, categories],
  )

  // Names come from the caller (translated), so take them fresh from the
  // prop on every render; only `isActive` lives in state. Without this a
  // language switch kept the old names until a reload.
  const displayCategories = useMemo(
    () =>
      categories.map((cat) => {
        const fresh = initialCategories.find((c) => c.id === cat.id)
        return fresh && fresh.name !== cat.name
          ? { ...cat, name: fresh.name }
          : cat
      }),
    [categories, initialCategories],
  )

  const value: EventVisibilityContextValue = {
    visibleColors,
    toggleColor,
    isColorVisible,
    categories: displayCategories,
    setCategories,
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
