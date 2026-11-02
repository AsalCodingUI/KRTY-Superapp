"use client"

import { TimeSelect } from "@/components/time-select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { addDays } from "@/shared/lib/santuy"
import { format } from "date-fns"
import { useState } from "react"
import type { SantuyData, SantuyPerson } from "../data"
import { dayDate, endTime, personName, zoneLabel } from "./shared"

/** Pick someone (not yet in the queue) to add at the end. */
export function AddPersonDialog({
  open,
  onOpenChange,
  data,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: SantuyData
  onAdd: (profileId: string) => Promise<void>
}) {
  const t = useT("santuy")
  const tc = useT("common")
  const [picked, setPicked] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Not already active; one entry per email (a person can have two rows).
  const activeIds = new Set(
    data.members.filter((m) => m.active).map((m) => m.profileId),
  )
  const activeEmails = new Set(
    [...activeIds]
      .map((id) => data.people.get(id)?.email?.toLowerCase())
      .filter(Boolean),
  )
  // A former member comes back as themselves (keeps their row).
  const formerByEmail = new Map(
    data.members
      .filter((m) => !m.active)
      .map((m) => [data.people.get(m.profileId)?.email?.toLowerCase(), m]),
  )
  const options = data.pickable
    .filter(
      (p) =>
        !activeIds.has(p.id) &&
        !(p.email && activeEmails.has(p.email.toLowerCase())),
    )
    .map((p) => {
      const former = p.email && formerByEmail.get(p.email.toLowerCase())
      return former ? { ...p, id: former.profileId } : p
    })

  const submit = async () => {
    if (!picked) return
    setBusy(true)
    try {
      await onAdd(picked)
      setPicked(null)
      onOpenChange(false)
    } catch {
      // Toasted by the caller; keep the dialog open.
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addTitle")}</DialogTitle>
          <DialogDescription>{t("addBody")}</DialogDescription>
        </DialogHeader>
        {options.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("nobodyLeft")}</p>
        ) : (
          <PersonSelect
            people={options}
            value={picked}
            onChange={setPicked}
            placeholder={t("pickPerson")}
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={submit} disabled={!picked || busy}>
            {busy && <Spinner data-icon="inline-start" />}
            {t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PersonSelect({
  people,
  value,
  onChange,
  placeholder,
  id,
}: {
  people: SantuyPerson[]
  value: string | null
  onChange: (id: string) => void
  placeholder: string
  id?: string
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as string)}>
      <SelectTrigger id={id} className="w-full" aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {people.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {personName(p)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export type WeekChoice = {
  date: string
  /** Who the rotation gives that week. */
  rotationId: string | null
}

type Mode = "rotation" | "assign"

/**
 * One week: follow the rotation, assign someone, or take it off. `dates`
 * are the upcoming session days (skip weeks included).
 */
export function WeekDialog({
  open,
  onOpenChange,
  data,
  dates,
  initialDate,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: SantuyData
  dates: WeekChoice[]
  initialDate: string | null
  onSave: (
    date: string,
    value: { kind: "skip" } | { kind: "assign"; profileId: string } | null,
  ) => Promise<void>
}) {
  const t = useT("santuy")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const [date, setDate] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("rotation")
  const [person, setPerson] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [lastOpen, setLastOpen] = useState(false)

  const load = (d: string | null) => {
    setDate(d)
    const week = d ? data.weeks.find((w) => w.date === d) : undefined
    setMode(week?.kind === "assign" ? "assign" : "rotation")
    setPerson(week?.kind === "assign" ? week.profileId : null)
  }
  // Reset to the requested week each time the dialog opens.
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) load(initialDate ?? dates[0]?.date ?? null)
  }

  const choice = dates.find((d) => d.date === date)
  const rotationName = choice?.rotationId
    ? personName(data.people.get(choice.rotationId))
    : null
  const valid = !!date && (mode !== "assign" || !!person)

  const submit = async () => {
    if (!date || !valid) return
    setBusy(true)
    try {
      await onSave(
        date,
        mode === "assign" ? { kind: "assign", profileId: person! } : null,
      )
      onOpenChange(false)
    } catch {
      // Toasted by the caller; keep the dialog open.
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("weekTitle")}</DialogTitle>
          <DialogDescription>{t("weekHint")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="santuy-week-date">{t("weekDate")}</Label>
          <Select value={date} onValueChange={(v) => v && load(v as string)}>
            <SelectTrigger id="santuy-week-date" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dates.map((d, i) => (
                <SelectItem key={d.date} value={d.date}>
                  {`${format(dayDate(d.date), "EEE, d MMM yyyy", {
                    locale: dateLocale,
                  })} · ${t("weekNumber", { n: i + 1 })}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("weekMode")}</Label>
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as Mode)}
            className="gap-2.5"
          >
            {(
              [
                [
                  "rotation",
                  rotationName
                    ? t("modeRotation", { name: rotationName })
                    : t("modeRotationEmpty"),
                ],
                ["assign", t("modeAssign")],
              ] as const
            ).map(([value, label]) => (
              <Label
                key={value}
                className="flex items-center gap-2.5 font-normal"
              >
                <RadioGroupItem value={value} />
                {label}
              </Label>
            ))}
          </RadioGroup>
        </div>

        {mode === "assign" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="santuy-week-person">{t("weekPerson")}</Label>
            <PersonSelect
              id="santuy-week-person"
              people={data.pickable}
              value={person}
              onChange={setPerson}
              placeholder={t("pickPerson")}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={submit} disabled={!valid || busy}>
            {busy && <Spinner data-icon="inline-start" />}
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const DURATIONS = [30, 45, 60, 90, 120]

/** Weekday, start time and length. */
export function SettingsDialog({
  open,
  onOpenChange,
  data,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: SantuyData
  onSave: (schedule: {
    weekday: number
    startTime: string
    durationMin: number
  }) => Promise<void>
}) {
  const t = useT("santuy")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const { settings } = data
  const [weekday, setWeekday] = useState(settings.weekday)
  const [startTime, setStartTime] = useState(settings.startTime)
  const [durationMin, setDurationMin] = useState(settings.durationMin)
  const [busy, setBusy] = useState(false)
  const [lastOpen, setLastOpen] = useState(false)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setWeekday(settings.weekday)
      setStartTime(settings.startTime)
      setDurationMin(settings.durationMin)
    }
  }

  // 2026-11-02 is a Monday: list the week Monday first.
  const days = [1, 2, 3, 4, 5, 6, 0].map((d) => ({
    value: d,
    label: format(dayDate(addDays("2026-11-01", d)), "EEEE", {
      locale: dateLocale,
    }),
  }))
  const durations = DURATIONS.includes(durationMin)
    ? DURATIONS
    : [...DURATIONS, durationMin].sort((a, b) => a - b)
  const tz = zoneLabel(settings.timezone)

  const submit = async () => {
    setBusy(true)
    try {
      await onSave({ weekday, startTime, durationMin })
      onOpenChange(false)
    } catch {
      // Toasted by the caller; keep the dialog open.
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("settingsTitle")}</DialogTitle>
          <DialogDescription>{t("settingsHint")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="santuy-weekday">{t("weekday")}</Label>
          <Select
            value={weekday}
            onValueChange={(v) => v !== null && setWeekday(Number(v))}
          >
            <SelectTrigger id="santuy-weekday" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {days.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <Label>{t("startTime", { tz })}</Label>
            <TimeSelect
              value={startTime}
              onValueChange={setStartTime}
              step={15}
              className="w-full"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="santuy-duration">{t("duration")}</Label>
            <Select
              value={durationMin}
              onValueChange={(v) => v !== null && setDurationMin(Number(v))}
            >
              <SelectTrigger id="santuy-duration" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map((n) => (
                  <SelectItem key={n} value={n}>
                    {t("minutes", { n })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-muted-foreground text-[13px]">
          {t("everyWeek", {
            day: days.find((d) => d.value === weekday)?.label ?? "",
            start: startTime,
            end: endTime(startTime, durationMin),
            tz,
          })}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Spinner data-icon="inline-start" />}
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
