"use client"

import {
  createContext,
  useCallback,
  useContext,
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
    (color: EventColor) => visibleColors.has(color),
    [visibleColors],
  )

  const value: EventVisibilityContextValue = {
    visibleColors,
    toggleColor,
    isColorVisible,
    categories,
    setCategories,
  }

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
