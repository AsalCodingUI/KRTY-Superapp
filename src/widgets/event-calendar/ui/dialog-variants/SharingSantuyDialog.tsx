"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { useQueryClient } from "@tanstack/react-query"
import { format, isSameDay } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"
import type { CalendarEvent } from "../types"

/** Who joined, as stored in `guests` by toggle_sharing_santuy_join. */
type Participant = { id?: string; name?: string | null }

export function participantsOf(event: CalendarEvent): Participant[] {
  const raw = event.guests as unknown
  return Array.isArray(raw)
    ? (raw as Participant[]).filter((p) => p && typeof p.id === "string")
    : []
}

const isUrl = (value: string) => /^https?:\/\//i.test(value)

/**
 * A Sharing Santuy session: topic, speaker, time and place, who's coming,
 * and one button to join or leave. The host (and stakeholders) can edit.
 */
export function SharingSantuyDialog({
  open,
  onOpenChange,
  event,
  canEdit,
  onEdit,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent
  canEdit: boolean
  onEdit: () => void
  onDelete?: (eventId: string) => Promise<void>
}) {
  const t = useT("calendar")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const queryClient = useQueryClient()
  const { profile } = useUserProfile()
  // Local copy so joining shows at once (the calendar refetches behind it).
  const [participants, setParticipants] = useState(() => participantsOf(event))
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const joined = participants.some((p) => p.id === profile?.id)

  const when = event.allDay
    ? format(event.start, "EEEE, d MMMM yyyy", { locale: dateLocale })
    : isSameDay(event.start, event.end)
      ? `${format(event.start, "EEEE, d MMMM yyyy · HH:mm", { locale: dateLocale })} – ${format(event.end, "HH:mm")}`
      : `${format(event.start, "d MMM yyyy HH:mm", { locale: dateLocale })} – ${format(event.end, "d MMM yyyy HH:mm", { locale: dateLocale })}`
  const place = event.location || event.meetingUrl

  const toggleJoin = async () => {
    setBusy(true)
    const rpc = createClient().rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>
    const { data, error } = await rpc("toggle_sharing_santuy_join", {
      p_event_id: event.id,
    })
    setBusy(false)
    if (error) {
      toast.error(t("santuyJoinFailed"))
      return
    }
    setParticipants(
      Array.isArray(data)
        ? (data as Participant[]).filter((p) => typeof p?.id === "string")
        : [],
    )
    toast.success(joined ? t("santuyLeft") : t("santuyJoined"))
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
  }

  const remove = async () => {
    if (!onDelete) return
    setBusy(true)
    try {
      await onDelete(event.id)
      onOpenChange(false)
    } finally {
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[35rem]">
        <DialogHeader>
          <DialogTitle>{t("eventTypeSharingSantuy")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-heading text-base font-medium break-words">
              {event.title}
            </h3>
            {event.organizer && (
              <p className="text-muted-foreground text-sm">
                {t("santuySpeakerBy", { name: event.organizer })}
              </p>
            )}
          </div>

          <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-muted-foreground">{t("santuyWhen")}</dt>
            <dd className="text-foreground">{when}</dd>
            {place && (
              <>
                <dt className="text-muted-foreground">{t("dialogLocation")}</dt>
                <dd className="text-foreground break-words">
                  {isUrl(place) ? (
                    <a
                      href={place}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      {place}
                    </a>
                  ) : (
                    place
                  )}
                </dd>
              </>
            )}
            <dt className="text-muted-foreground">{t("santuyParticipants")}</dt>
            <dd className="text-foreground">
              {participants.length === 0 ? (
                <span className="text-muted-foreground">
                  {t("santuyNoParticipants")}
                </span>
              ) : (
                <span className="flex flex-wrap gap-1.5">
                  {participants.map((p) => (
                    <Badge key={p.id} variant="secondary">
                      {p.name || "—"}
                    </Badge>
                  ))}
                </span>
              )}
            </dd>
          </dl>

          {event.description && (
            <p className="text-foreground text-sm break-words whitespace-pre-wrap">
              {event.description}
            </p>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex items-center gap-2">
            {canEdit &&
              onDelete &&
              (confirmDelete ? (
                <>
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={remove}
                  >
                    {t("dialogDeleteYes")}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => setConfirmDelete(false)}
                  >
                    {tc("cancel")}
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  {tc("delete")}
                </Button>
              ))}
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button variant="outline" onClick={onEdit}>
                {tc("edit")}
              </Button>
            )}
            <Button
              variant={joined ? "outline" : "default"}
              disabled={busy}
              onClick={toggleJoin}
            >
              {joined ? t("santuyLeave") : t("santuyJoin")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
