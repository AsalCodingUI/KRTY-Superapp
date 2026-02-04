"use client"

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  type DragOverEvent,
} from "@dnd-kit/core"
import { createContext, useContext, useState, type ReactNode } from "react"
import type { CalendarEvent, DraggedEvent } from "./types"

interface CalendarDndContextValue {
  activeEvent: DraggedEvent | null
  handleDragStart: (event: DragStartEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  handleDragOver: (event: DragOverEvent) => void
}

const CalendarDndContext = createContext<CalendarDndContextValue | undefined>(
  undefined,
)

interface CalendarDndProviderProps {
  children: ReactNode
  events: CalendarEvent[]
  onEventUpdate: (event: CalendarEvent) => void
}

export function CalendarDndProvider({
  children,
  events,
  onEventUpdate,
}: CalendarDndProviderProps) {
  const [activeEvent, setActiveEvent] = useState<DraggedEvent | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const eventId = event.active.id as string
    const draggedEvent = events.find((e) => e.id === eventId)

    if (draggedEvent) {
      setActiveEvent({
        event: draggedEvent,
        originalStart: draggedEvent.start,
        originalEnd: draggedEvent.end,
      })
    }
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Can be used for visual feedback during drag
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event

    if (!over || !activeEvent) {
      setActiveEvent(null)
      return
    }

    // Parse the drop target data
    // Format: "slot-{date}-{hour}-{minute}"
    const dropData = over.id as string

    if (dropData.startsWith("slot-")) {
      const [, dateStr, hourStr, minuteStr] = dropData.split("-")
      const newStart = new Date(dateStr)
      newStart.setHours(parseInt(hourStr), parseInt(minuteStr), 0, 0)

      // Calculate duration
      const duration =
        activeEvent.originalEnd.getTime() - activeEvent.originalStart.getTime()
      const newEnd = new Date(newStart.getTime() + duration)

      // Update event
      const updatedEvent: CalendarEvent = {
        ...activeEvent.event,
        start: newStart,
        end: newEnd,
      }

      onEventUpdate(updatedEvent)
    }

    setActiveEvent(null)
  }

  const value: CalendarDndContextValue = {
    activeEvent,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
  }

  return (
    <CalendarDndContext.Provider value={value}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay>
          {activeEvent && (
            <div className="bg-surface shadow-md-border rounded-lg p-2 opacity-90">
              <div className="text-label-md text-tremor-content-strong">
                {activeEvent.event.title}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </CalendarDndContext.Provider>
  )
}

export function useCalendarDnd() {
  const context = useContext(CalendarDndContext)
  if (!context) {
    throw new Error("useCalendarDnd must be used within CalendarDndProvider")
  }
  return context
}
