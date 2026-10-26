"use client"

import { HomeCard } from "@/app/(main)/dashboard/components/home-card"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format, isPast } from "date-fns"
import { RiCalendarLine } from "@/shared/ui/lucide-icons"
import { useState } from "react"
import { toast } from "sonner"
import {
  byDay,
  dayLabel,
  modeLabel,
  post,
  slotError,
  timeRange,
  type Slot,
} from "./OneOnOne"

/**
 * The member's 1:1 as a card: their booked session (join / release), or
 * the open slots as time pills grouped by day, one click to book. With
 * `subject`, someone else's 1:1 for a stakeholder: their session in the
 * period (the upcoming one, else the latest), read-only.
 */
export function MyOneOnOneCard({
  period,
  className,
  subject,
}: {
  period: string
  className?: string
  /** Whose 1:1, when it isn't the viewer's (stakeholders only). */
  subject?: { id: string; name: string }
}) {
  const readOnly = Boolean(subject)
  const t = useT("performance")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const { profile } = useUserProfile()
  const queryClient = useQueryClient()
  const queryKey = ["one-on-one-slots", period, subject?.id ?? "me"]
  const [busyId, setBusyId] = useState<string | null>(null)
  const [releasing, setReleasing] = useState<Slot | null>(null)

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ cycle: period })
      if (subject) params.set("user", subject.id)
      const res = await fetch(`/api/one-on-one/slots?${params}`)
      if (!res.ok) throw new Error("fetch_failed")
      return ((await res.json()) as { slots: Slot[] }).slots
    },
  })

  const act = async (slot: Slot, action: "book" | "release") => {
    setBusyId(slot.id)
    const { ok, error } =
      action === "book"
        ? await post("/api/one-on-one/book", { slotId: slot.id })
        : await post("/api/one-on-one/cancel", {
            slotId: slot.id,
            action: "release",
          })
    setBusyId(null)
    if (ok)
      toast.success(t(action === "book" ? "bookSuccess" : "releaseSuccess"))
    else
      toast.error(
        slotError(t, error, action === "book" ? "bookError" : "releaseFailed"),
      )
    queryClient.invalidateQueries({ queryKey })
  }

  const slots = data ?? []
  const upcoming = slots.filter((s) => !isPast(new Date(s.end_at)))
  // Someone else's: the API already returns only their sessions.
  const theirs = slots.filter((s) => s.status === "booked")
  const mine = slots.filter(
    (s) => s.status === "booked" && s.booked_by_profile?.id === profile?.id,
  )
  // One 1:1 per quarter: the upcoming session, else the one that happened
  // (then no more slots to pick; the API refuses a second one too).
  const booked = readOnly
    ? (theirs.find((s) => !isPast(new Date(s.end_at))) ?? theirs.at(-1))
    : (mine.find((s) => !isPast(new Date(s.end_at))) ?? mine.at(-1))
  const bookedDone = Boolean(booked && isPast(new Date(booked.end_at)))
  const open =
    readOnly || booked ? [] : upcoming.filter((s) => s.status === "open")

  return (
    <HomeCard
      className={className}
      title={t("tabOneOnOne")}
      badge={
        booked &&
        (bookedDone ? (
          <Badge variant="secondary">{t("my1on1Done")}</Badge>
        ) : (
          <Badge variant="success">{t("my1on1Booked")}</Badge>
        ))
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : booked ? (
        <>
          <div className="flex items-center gap-4">
            {/* Calendar-leaf date, like an invite. */}
            <div className="border-border flex w-14 shrink-0 flex-col items-center overflow-hidden rounded-xl border">
              <span className="bg-muted text-muted-foreground w-full py-0.5 text-center text-[11px] uppercase">
                {format(new Date(booked.start_at), "MMM", {
                  locale: dateLocale,
                })}
              </span>
              <span className="text-heading py-1 text-xl leading-tight tabular-nums">
                {format(new Date(booked.start_at), "d")}
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-foreground truncate text-[15px]">
                {format(new Date(booked.start_at), "EEEE", {
                  locale: dateLocale,
                })}{" "}
                · <span className="tabular-nums">{timeRange(booked)}</span>
              </p>
              <p className="text-muted-foreground truncate text-[13px]">
                {t("withOrganizer", {
                  name: booked.organizer?.full_name ?? t("admin"),
                })}{" "}
                · {modeLabel(booked, t)}
              </p>
            </div>
          </div>
          {!readOnly && !bookedDone && (
            <div className="border-border mt-auto flex gap-2 border-t pt-4">
              {booked.meeting_url && (
                <Button
                  className="flex-1"
                  nativeButton={false}
                  render={
                    <a
                      href={booked.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  {t("join")}
                </Button>
              )}
              <Button
                variant="secondary"
                className={cn(!booked.meeting_url && "flex-1")}
                disabled={busyId === booked.id}
                onClick={() => setReleasing(booked)}
              >
                {t("release")}
              </Button>
            </div>
          )}
        </>
      ) : open.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-2 text-center">
          <span className="bg-muted text-muted-foreground mb-1 flex size-9 items-center justify-center rounded-xl">
            <RiCalendarLine className="size-4" />
          </span>
          <p className="text-foreground text-sm">
            {subject
              ? t("their1on1Empty", { name: subject.name })
              : t("noAvailableSlots")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {byDay(open)
            .slice(0, 4)
            .map(([day, items]) => (
              <div key={day} className="flex flex-col gap-2">
                <p className="text-foreground text-[13px]">
                  {dayLabel(day, t, dateLocale)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((s) => (
                    <Button
                      key={s.id}
                      size="sm"
                      variant="secondary"
                      className="rounded-full tabular-nums"
                      title={`${modeLabel(s, t)} · ${t("withOrganizer", {
                        name: s.organizer?.full_name ?? t("admin"),
                      })}`}
                      disabled={busyId !== null}
                      onClick={() => act(s, "book")}
                    >
                      {timeRange(s)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(releasing)}
        onOpenChange={(o) => !o && setReleasing(null)}
        title={t("releaseTitle")}
        description={t("releaseDescription")}
        confirmText={t("release")}
        cancelText={tc("cancel")}
        variant="destructive"
        onConfirm={async () => {
          if (releasing) await act(releasing, "release")
          setReleasing(null)
        }}
      />
    </HomeCard>
  )
}
