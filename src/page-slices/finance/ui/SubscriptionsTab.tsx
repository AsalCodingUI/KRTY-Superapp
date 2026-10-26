"use client"

import { HomeCard, HomeRow } from "@/app/(main)/dashboard/components/home-card"
import { EmptyState } from "@/components/empty-state"
import { PieChart } from "lucide-react"
import { SegmentedControl } from "@/components/segmented-control"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiWalletLine,
} from "@/shared/ui/lucide-icons"
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  min,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { useDateLocale, useLocale, useT } from "@/shared/i18n/client"
import { useMemo, useState } from "react"
import {
  categoryColor,
  categoryLabel,
  chargeIdr,
  chargesBetween,
  isActive,
  missingRate,
  monthly,
  nextCharge,
  rateOf,
  yearRange,
  type FxRates,
  type Subscription,
} from "@/entities/finance/lib/money"
import { useMoneyFormat } from "../model/hide-money"
import { Donut, NameTile, StatTiles } from "./parts"

const CYCLE_LABEL = { monthly: "cycleMonthly", yearly: "cycleYearly" } as const

/**
 * Recurring costs on the Home card system: three headline cards, then the
 * list or a month calendar (Calendar page style), and the split by category.
 * Every total is IDR; foreign items show their own price and rate too.
 */
export function SubscriptionsTab({
  subscriptions,
  rates,
  year,
  onAdd,
  onEdit,
}: {
  subscriptions: Subscription[]
  rates: FxRates
  year: number
  onAdd: () => void
  onEdit: (sub: Subscription) => void
}) {
  const { rupiah, rupiahShort, money } = useMoneyFormat()
  const t = useT("finance")
  const locale = useLocale()
  const dateLocale = useDateLocale()
  const today = startOfDay(new Date())
  // Today's charge already counts as paid, so "next" starts tomorrow.
  const tomorrow = addDays(today, 1)
  const { start, end } = yearRange(year)
  const thisYear = year === today.getFullYear()
  const [view, setView] = useState<"list" | "month">("list")
  const [month, setMonth] = useState(() =>
    startOfMonth(thisYear ? today : start),
  )

  const active = subscriptions.filter((s) => isActive(s, today))
  const perMonth = active.reduce((sum, s) => sum + monthly(s, rates), 0)
  const unrated = subscriptions.filter((s) => missingRate(s, rates))

  const paid = subscriptions.flatMap((s) =>
    chargesBetween(s, start, min([today, end])).map((d) => ({ s, d })),
  )
  const upcoming =
    today < end
      ? subscriptions
          .flatMap((s) =>
            chargesBetween(s, tomorrow, end).map((d) => ({ s, d })),
          )
          .sort((a, b) => a.d.getTime() - b.d.getTime())
      : []
  const sum = (rows: { s: Subscription }[]) =>
    rows.reduce((total, r) => total + chargeIdr(r.s, rates), 0)

  const byCategory = useMemo(() => {
    const totals = new Map<string, number>()
    for (const s of active)
      totals.set(s.category, (totals.get(s.category) ?? 0) + monthly(s, rates))
    return [...totals.entries()]
      .map(([key, value]) => ({ key, value, color: categoryColor(key) }))
      .sort((a, b) => b.value - a.value)
  }, [active, rates])

  const sorted = [...subscriptions].sort((a, b) => {
    const na = nextCharge(a, tomorrow)?.getTime() ?? Infinity
    const nb = nextCharge(b, tomorrow)?.getTime() ?? Infinity
    return na - nb || a.name.localeCompare(b.name)
  })

  return (
    <div className="flex flex-col gap-4">
      <StatTiles
        items={[
          {
            key: "perMonth",
            label: t("perMonth"),
            value: rupiah(perMonth),
            hint: t("activeSubscriptions", { n: active.length }),
          },
          {
            key: "paid",
            label: thisYear ? t("paidThisYear") : t("paidYear", { year }),
            value: rupiah(sum(paid)),
            hint: t("bills", { n: paid.length }),
          },
          {
            key: "upcoming",
            label: thisYear
              ? t("upcomingThisYear")
              : t("remainingYear", { year }),
            value: rupiah(sum(upcoming)),
            hint: upcoming[0]
              ? t("nextBill", {
                  name: upcoming[0].s.name,
                  date: format(upcoming[0].d, "d MMM", { locale: dateLocale }),
                })
              : t("noMoreBills"),
          },
        ]}
      />

      {unrated.length > 0 && (
        <p className="border-warning/40 text-warning rounded-lg border px-4 py-2.5 text-sm">
          {t("unratedSubscriptions", {
            currencies: [...new Set(unrated.map((s) => s.currency))].join(", "),
            n: unrated.length,
          })}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <HomeCard
          title={t("subscriptions")}
          badge={
            <span className="text-tertiary-foreground text-sm tabular-nums">
              {subscriptions.length}
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              {view === "month" && (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("prevMonth")}
                    onClick={() => setMonth((m) => addMonths(m, -1))}
                  >
                    <RiArrowLeftSLine />
                  </Button>
                  <span className="w-28 text-center text-sm tabular-nums">
                    {format(month, "MMMM yyyy", { locale: dateLocale })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("nextMonth")}
                    onClick={() => setMonth((m) => addMonths(m, 1))}
                  >
                    <RiArrowRightSLine />
                  </Button>
                </div>
              )}
              <SegmentedControl
                fitContent
                value={view}
                onChange={setView}
                items={[
                  { value: "list", label: t("viewList") },
                  { value: "month", label: t("viewMonth") },
                ]}
              />
            </div>
          }
        >
          {subscriptions.length === 0 ? (
            <EmptyState
              placement="inner"
              icon={<RiWalletLine />}
              title={t("noSubscriptionsTitle")}
              description={t("noSubscriptionsHint")}
              action={{ label: t("addSubscription"), onClick: onAdd }}
            />
          ) : view === "list" ? (
            <div className="flex flex-col">
              {sorted.map((s) => {
                const next = nextCharge(s, tomorrow)
                const ended = !isActive(s, today)
                const rate = rateOf(s.currency, s.fx_rate, rates)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onEdit(s)}
                    className={cn("text-left", ended && "opacity-60")}
                  >
                    <HomeRow
                      leading={<NameTile name={s.name} className="size-7" />}
                      title={s.name}
                      subtitle={[
                        categoryLabel(t, s.category),
                        t(CYCLE_LABEL[s.cycle]),
                        ended
                          ? t("stopped")
                          : next
                            ? t("nextOn", {
                                date: format(next, "d MMM yyyy", {
                                  locale: dateLocale,
                                }),
                              })
                            : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      trailing={
                        <span className="flex flex-col items-end">
                          <span>
                            {s.currency === "IDR"
                              ? rupiah(s.amount_idr)
                              : rate
                                ? rupiah(chargeIdr(s, rates))
                                : money(s.amount_idr, s.currency)}
                          </span>
                          {s.currency !== "IDR" && (
                            <span className="text-muted-foreground text-[12px]">
                              {money(s.amount_idr, s.currency)}
                              {rate
                                ? ` · ${t("rateN", { rate: rate.toLocaleString("id-ID") })}`
                                : ` · ${t("noRate")}`}
                            </span>
                          )}
                        </span>
                      }
                    />
                  </button>
                )
              })}
            </div>
          ) : (
            <MonthGrid
              month={month}
              subscriptions={subscriptions}
              rates={rates}
              onEdit={onEdit}
            />
          )}
        </HomeCard>

        <HomeCard title={t("byCategory")}>
          {byCategory.length === 0 ? (
            // Nothing running: no empty donut, the shared empty state.
            <EmptyState
              placement="inner"
              icon={<PieChart />}
              title={t("noActiveCostsTitle")}
              description={t("noActiveCostsHint")}
            />
          ) : (
            <>
              <Donut
                data={byCategory}
                label={rupiahShort(perMonth, locale)}
                sublabel={t("perMonthLower")}
              />

              <div className="flex flex-col">
                {byCategory.map((c) => (
                  <HomeRow
                    key={c.key}
                    leading={
                      <span
                        aria-hidden
                        className="size-2 rounded-full"
                        style={{ background: c.color }}
                      />
                    }
                    title={categoryLabel(t, c.key)}
                    trailing={
                      <>
                        <span className="text-muted-foreground text-[13px]">
                          {perMonth
                            ? Math.round((c.value / perMonth) * 100)
                            : 0}
                          %
                        </span>
                        <span>{rupiah(c.value)}</span>
                      </>
                    }
                  />
                ))}
              </div>
            </>
          )}
        </HomeCard>
      </div>
    </div>
  )
}

/** Month grid styled like the Calendar page's month view. */
function MonthGrid({
  month,
  subscriptions,
  rates,
  onEdit,
}: {
  month: Date
  subscriptions: Subscription[]
  rates: FxRates
  onEdit: (sub: Subscription) => void
}) {
  const { rupiahShort, money } = useMoneyFormat()
  const locale = useLocale()
  const dateLocale = useDateLocale()
  const gridStart = startOfWeek(month, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const charges = subscriptions.flatMap((s) =>
    chargesBetween(s, gridStart, gridEnd).map((d) => ({ s, d })),
  )
  const days: Date[] = []
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d)

  return (
    <div className="border-border -mx-5 -mb-5 overflow-hidden border-t">
      <div className="border-border grid grid-cols-7 border-b">
        {days
          .slice(0, 7)
          .map((day) => format(day, "EEE", { locale: dateLocale }))
          .map((d) => (
            <span
              key={d}
              className="text-muted-foreground border-r px-2.5 py-2 text-sm last:border-r-0"
            >
              {d}
            </span>
          ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const inMonth = isSameMonth(d, month)
          const items = charges.filter((c) => isSameDay(c.d, d))
          return (
            <div
              key={d.toISOString()}
              className={cn(
                "flex min-h-[96px] flex-col border-r border-b p-1.5 [&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0",
                isToday(d) && "bg-foreground/[0.025]",
              )}
            >
              <span
                className={cn(
                  "mb-1 flex size-6 items-center justify-center rounded-[5px] text-[13px] tabular-nums",
                  isToday(d)
                    ? "bg-foreground text-background font-medium"
                    : inMonth
                      ? "text-muted-foreground"
                      : "text-muted-foreground/40",
                )}
              >
                {format(d, "d")}
              </span>
              <div className="space-y-px">
                {items.map(({ s }) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onEdit(s)}
                    title={`${s.name} · ${money(s.amount_idr, s.currency)}`}
                    className="hover:bg-accent flex w-full min-w-0 items-center gap-1.5 rounded-sm px-1 py-0.5 text-left text-[13px]"
                  >
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: categoryColor(s.category) }}
                    />
                    <span className="truncate">{s.name}</span>
                    <span className="text-muted-foreground ml-auto shrink-0 tabular-nums">
                      {rupiahShort(
                        chargeIdr(s, rates) || Number(s.amount_idr),
                        locale,
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
