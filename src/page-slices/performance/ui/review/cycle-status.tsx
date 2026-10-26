"use client"

import type { ReviewCycle } from "@/app/(main)/performance/actions/review-actions"
import { Badge } from "@/components/ui/badge"
import {
  daysLeft,
  wibDay,
  type CycleStatus,
} from "@/entities/performance/lib/review-cycle"
import { useDateLocale, useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"
import { format, parseISO } from "date-fns"

/** A cycle moment as its WIB calendar day, whatever the browser's zone. */
const wib = (iso: string) => parseISO(wibDay(iso))

const LABEL: Record<CycleStatus, MessageKey<"performance">> = {
  scheduled: "cycleScheduled",
  running: "cycleRunning",
  ended: "cycleEnded",
  closed: "cycleClosed",
}

const VARIANT = {
  scheduled: "info",
  running: "success",
  ended: "secondary",
  closed: "secondary",
} as const satisfies Record<CycleStatus, string>

/** A 360 cycle's state as a badge (scheduled / running / ended / closed). */
export function CycleStatusBadge({ status }: { status: CycleStatus }) {
  const t = useT("performance")
  return <Badge variant={VARIANT[status]}>{t(LABEL[status])}</Badge>
}

/** "2 Nov – 31 Des 2026" for a cycle's window. */
export function useCycleRange() {
  const dateLocale = useDateLocale()
  return (cycle: Pick<ReviewCycle, "start_date" | "end_date">) =>
    `${format(wib(cycle.start_date), "d MMM", { locale: dateLocale })} – ${format(wib(cycle.end_date), "d MMM yyyy", { locale: dateLocale })}`
}

/**
 * One line on where a member stands with this cycle, for the 360 card:
 * opens on…, closes on… (days left), or waiting for the result. Null when
 * there's a result (the card shows the button) or no cycle at all.
 */
export function useCycleLine() {
  const t = useT("performance")
  const dateLocale = useDateLocale()
  return (cycle: ReviewCycle | null, hasResult: boolean) => {
    if (!cycle) return hasResult ? null : t("my360NoCycle")
    const day = (iso: string) =>
      format(wib(iso), "d MMM", { locale: dateLocale })
    if (cycle.status === "scheduled")
      return t("my360OpensOn", { date: day(cycle.start_date) })
    if (cycle.status === "running") {
      const n = daysLeft(cycle.end_date)
      return n === 0
        ? t("my360ClosesToday", { date: day(cycle.end_date) })
        : t("my360ClosesIn", { date: day(cycle.end_date), n })
    }
    return hasResult ? null : t("my360Awaiting")
  }
}
