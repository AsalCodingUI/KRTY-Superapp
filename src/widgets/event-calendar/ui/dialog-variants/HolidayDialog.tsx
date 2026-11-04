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
import { accessLevel } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { getIdHoliday, type IdHoliday } from "@/shared/lib/id-holidays"
import { RiCalendarLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { runUndo } from "@/shared/undo"
import {
  officeHolidayKey as officeKey,
  setOfficeHoliday,
  unsetOfficeHoliday,
  registerOfficeHolidayUndo,
} from "../../lib/office-holiday"
import type { CalendarEvent } from "../types"
import { dialogWidth } from "@/components/ui/dialog-sections"

interface HolidayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent
}

/**
 * A national holiday (or the office holiday made from one): what it is and
 * why it's a day off. Stakeholders turn it into an office holiday here (a
 * "Company Holiday" row everyone sees, linked by holiday_key) and undo it.
 * Google's holiday feed falls back to the plain read-only view.
 */
export function HolidayDialog({
  open,
  onOpenChange,
  event,
}: HolidayDialogProps) {
  const t = useT("calendar")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const holiday = getIdHoliday(event.holidayKey)
  const date = holiday ? parseISO(holiday.date) : event.start

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogWidth.form}>
        <DialogHeader>
          <DialogTitle className="text-heading text-title pr-6 font-medium break-words">
            {holiday?.name ?? event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span className="text-foreground flex items-center gap-2">
              <RiCalendarLine className="text-muted-foreground size-4" />
              {format(date, "EEEE, d MMMM yyyy", { locale: dateLocale })}
            </span>
            <Badge variant="destructive">
              {holiday
                ? t(
                    holiday.kind === "cuti_bersama"
                      ? "holidayKindCutiBersama"
                      : "holidayKindNasional",
                  )
                : t("holidayBadge")}
            </Badge>
          </div>

          {(holiday?.description ?? event.description) && (
            <div className="flex flex-col gap-1">
              <h4 className="text-muted-foreground text-xs font-medium">
                {t(holiday ? "holidayWhy" : "holidayAbout")}
              </h4>
              <p className="text-foreground text-sm break-words whitespace-pre-wrap">
                {holiday?.description ?? event.description}
              </p>
            </div>
          )}

          {holiday ? (
            <OfficeHoliday holiday={holiday} holidayKey={event.holidayKey!} />
          ) : (
            <p className="text-muted-foreground text-xs">{t("holidayInfo")}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OfficeHoliday({
  holiday,
  holidayKey,
}: {
  holiday: IdHoliday
  holidayKey: string
}) {
  const t = useT("calendar")
  const tu = useT("undo")
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()
  const { profile, authProfile } = useUserProfile()
  const isStakeholder = accessLevel(profile) === "stakeholder"
  const [busy, setBusy] = useState(false)

  const { data: officeId, isLoading } = useQuery({
    queryKey: officeKey(holidayKey),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("id")
        .eq("holiday_key", holidayKey)
        .maybeSingle()
      if (error) throw error
      return data?.id ?? null
    },
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: officeKey(holidayKey) })
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
  }

  const remove = async () => {
    const ok = await unsetOfficeHoliday(holidayKey)
    refresh()
    if (!ok) toast.error(t("holidayOfficeFailed"))
    return ok
  }

  const add = async () => {
    const ok = await setOfficeHoliday(
      holiday,
      holidayKey,
      authProfile?.id ?? profile?.id ?? null,
    )
    refresh()
    if (!ok) toast.error(t("holidayOfficeFailed"))
    return ok
  }

  const run = async (action: () => Promise<boolean>, done: string) => {
    setBusy(true)
    try {
      if (!(await action())) return
      // ⌘Z and the toast's Undo are the same step (shared/undo).
      const on = action === add
      const undoId = registerOfficeHolidayUndo({
        on,
        holiday,
        holidayKey,
        userId: authProfile?.id ?? profile?.id ?? null,
        label: tu(on ? "holidaySet" : "holidayCancel", { name: holiday.name }),
        refresh,
      })
      toast.success(done, {
        action: {
          label: t("holidayOfficeUndo"),
          onClick: () => void runUndo("undo", undoId),
        },
      })
    } finally {
      setBusy(false)
    }
  }

  const isSet = Boolean(officeId)

  if (!isStakeholder) {
    return isSet ? (
      <p className="text-muted-foreground text-xs">
        {t("holidayOfficeSetNote")}
      </p>
    ) : null
  }

  return (
    <div className="bg-foreground/[0.03] flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        {isSet && <Badge variant="success">{t("holidayOffice")}</Badge>}
        <p className="text-muted-foreground text-xs">
          {t(isSet ? "holidayOfficeSetNote" : "holidayOfficeNote")}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant={isSet ? "outline" : "default"}
        className="shrink-0"
        disabled={busy || isLoading}
        onClick={() =>
          isSet
            ? run(remove, t("holidayOfficeUnsetToast"))
            : run(add, t("holidayOfficeSetToast", { name: holiday.name }))
        }
      >
        {t(isSet ? "holidayOfficeCancel" : "holidayOfficeMake")}
      </Button>
    </div>
  )
}
