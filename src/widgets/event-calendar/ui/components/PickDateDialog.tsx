"use client"

import type { Calendar as CalendarType } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useDateLocale } from "@/shared/i18n/client"
import dynamic from "next/dynamic"
import { useState } from "react"

type CalendarLocale = React.ComponentProps<typeof CalendarType>["locale"]

// The month grid loads when the dialog first opens.
const Calendar = dynamic(
  () => import("@/components/ui/calendar").then((m) => m.Calendar),
  { ssr: false, loading: () => <div className="h-[296px] w-[252px]" /> },
)

/**
 * One month grid in a small dialog; clicking a day picks it and closes
 * ("Pergi ke tanggal…", "Pindah ke tanggal…" from the right-click menu).
 */
export function PickDateDialog({
  open,
  onOpenChange,
  title,
  description,
  initial,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** Selected and shown when it opens. */
  initial: Date
  onPick: (date: Date) => void
}) {
  const locale = useDateLocale()
  const [month, setMonth] = useState(initial)
  const [lastOpen, setLastOpen] = useState(false)
  // Start on the given month each time it opens.
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) setMonth(initial)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-auto sm:max-w-fit">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={initial}
            // The clicked day, also when it's the selected one (which
            // single mode would otherwise deselect).
            onSelect={(_selected: Date | undefined, day: Date) => {
              onOpenChange(false)
              onPick(day)
            }}
            required={false}
            locale={locale as CalendarLocale}
            captionLayout="dropdown"
            autoFocus
            className="bg-transparent p-0"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
