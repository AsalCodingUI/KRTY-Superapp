"use client"

import { ListChip } from "@/components/grouped-list"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format, parseISO } from "date-fns"
import { daysLeft, statusLabelKey, type ContractRow } from "../model/data"

/** Who is looking: the role picked on the server. */
export type ContractViewer = {
  id: string
  name: string | null
  isAdmin: boolean
}

/** "1 Jan 2027 – 31 Des 2027" or "Sejak 1 Jan 2027". */
export function usePeriodLabel() {
  const t = useT("contracts")
  const dateLocale = useDateLocale()
  return (c: Pick<ContractRow, "start_date" | "end_date">) => {
    const fmt = (d: string) =>
      format(parseISO(d), "d MMM yyyy", { locale: dateLocale })
    return c.end_date
      ? t("periodRange", { start: fmt(c.start_date), end: fmt(c.end_date) })
      : t("periodOpen", { start: fmt(c.start_date) })
  }
}

export function StatusBadge({ status }: { status: string }) {
  const t = useT("contracts")
  return (
    <Badge
      variant={
        status === "acknowledged"
          ? "success"
          : status === "draft"
            ? "outline"
            : "warning"
      }
    >
      {t(statusLabelKey(status))}
    </Badge>
  )
}

/** Amber "Berakhir 12 hari lagi" for contracts ending within 30 days. */
export function EndingChip({
  contract,
  className,
}: {
  contract: Pick<ContractRow, "end_date">
  className?: string
}) {
  const t = useT("contracts")
  const days = daysLeft(contract)
  if (days === null || days > 30) return null
  return (
    <ListChip
      className={cn(
        days < 0
          ? "bg-muted text-tertiary-foreground"
          : "bg-warning-subtle text-amber-11",
        className,
      )}
    >
      {days < 0
        ? t("ended")
        : days === 0
          ? t("endsToday")
          : t("endsInDays", { n: days })}
    </ListChip>
  )
}
