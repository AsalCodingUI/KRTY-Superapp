"use client"

import { createClient } from "@/shared/api/supabase/client"
import {
  CalendarProvider,
  type CalendarEvent,
  type EventCategory,
} from "@/widgets/event-calendar"
import { canManageByRole } from "@/shared/lib/roles"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { CalendarContent } from "./CalendarContent"

interface CalendarClientProps {
  role: string
}

export default function CalendarClient({ role }: CalendarClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const isStakeholder = canManageByRole(role)

  // Mock categories for now or fetch them
  const categories: EventCategory[] = [
    { id: "work", name: "Work", color: "blue", isActive: true },
    { id: "personal", name: "Personal", color: "emerald", isActive: true },
    { id: "urgent", name: "Urgent", color: "rose", isActive: true },
  ]

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    // TODO: Replace with real table fetch
    const { data, error } = await supabase.from("calendar_events").select("*")

    if (error) {
      // console.error(error)
      // Fallback to empty if table doesn't exist yet/error
      setEvents([])
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleEventAdd = async (eventData: Partial<CalendarEvent>) => {
    const { error } = await supabase.from("calendar_events").insert([eventData])
    if (error) {
      toast.error("Failed to add event")
      return
    }
    toast.success("Event added")
    fetchEvents()
    setDialogOpen(false)
  }

  const handleEventUpdate = async (eventData: Partial<CalendarEvent>) => {
    if (!eventData.id) return
    const { error } = await supabase
      .from("calendar_events")
      .update(eventData)
      .eq("id", eventData.id)

    if (error) {
      toast.error("Failed to update event")
      return
    }
    toast.success("Event updated")
    fetchEvents()
    setDialogOpen(false)
  }

  const handleEventDelete = async (eventId: string) => {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId)
    if (error) {
      toast.error("Failed to delete event")
      return
    }
    toast.success("Event deleted")
    fetchEvents()
  }

  return (
    <CalendarProvider>
      <CalendarContent
        events={events}
        loading={loading}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        handleEventAdd={handleEventAdd}
        handleEventUpdate={handleEventUpdate}
        handleEventDelete={handleEventDelete}
        isStakeholder={isStakeholder}
        categories={categories}
      />
    </CalendarProvider>
  )
}
