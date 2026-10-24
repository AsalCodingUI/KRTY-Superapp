"use client"

import {
  HomeCard,
  HomeEmpty,
  HomeRow,
} from "@/app/(main)/dashboard/components/home-card"
import { SegmentedControl } from "@/components/segmented-control"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import {
  differenceInCalendarDays,
  format,
  getMonth,
  min,
  parseISO,
  startOfDay,
} from "date-fns"
import { useDateLocale, useLocale, useT } from "@/shared/i18n/client"
import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import {
  chargeIdr,
  chargesBetween,
  leftToPay,
  missingRate,
  OPEN_STATUSES,
  openIdr,
  receivedIdr,
  yearRange,
  type FxRates,
  type InvoiceLite,
  type Subscription,
} from "@/entities/finance/lib/money"
import { useMoneyFormat } from "../model/hide-money"
import { Donut, NameTile, StatTiles } from "./parts"

const PALETTE = [
  "var(--color-blue-9)",
  "var(--color-orange-9)",
  "var(--color-purple-9)",
  "var(--color-teal-9)",
  "var(--color-pink-9)",
  "var(--color-green-9)",
]

const clientOf = (inv: InvoiceLite, fallback: string) =>
  inv.project?.client_name || inv.project?.name || fallback

/**
 * Money in (invoices) against money out (subscriptions) for one year, on the
 * Home card system. Everything totals in IDR at the recorded/default rate.
 */
export function OverviewTab({
  invoices,
  subscriptions,
  rates,
  year,
  goal,
  onSetGoal,
}: {
  invoices: InvoiceLite[]
  subscriptions: Subscription[]
  rates: FxRates
  year: number
  goal: number | null
  onSetGoal: () => void
}) {
  const { rupiah, rupiahShort } = useMoneyFormat()
  const t = useT("finance")
  const locale = useLocale()
  const dateLocale = useDateLocale()
  const chartConfig = {
    received: { label: t("received"), color: "var(--color-green-9)" },
  } satisfies ChartConfig
  const today = startOfDay(new Date())
  const { start, end } = yearRange(year)
  const inYear = invoices.filter(
    (inv) => parseISO(inv.issue_date).getFullYear() === year,
  )
  const received = inYear.reduce((s, i) => s + receivedIdr(i, rates), 0)
  const open = inYear.filter(
    (i) => OPEN_STATUSES.includes(i.status) && leftToPay(i) > 0,
  )
  const openTotal = open.reduce((s, i) => s + openIdr(i, rates), 0)
  const spent = subscriptions
    .flatMap((s) =>
      chargesBetween(s, start, min([today, end])).map(() =>
        chargeIdr(s, rates),
      ),
    )
    .reduce((a, b) => a + b, 0)
  const unrated = [
    ...new Set(
      [...inYear, ...subscriptions]
        .filter((x) => missingRate(x, rates))
        .map((x) => x.currency),
    ),
  ]

  // Cumulative money in by the month each invoice was issued.
  const series = useMemo(() => {
    const perMonth = Array<number>(12).fill(0)
    for (const inv of inYear)
      perMonth[getMonth(parseISO(inv.issue_date))] += receivedIdr(inv, rates)
    let running = 0
    const lastMonth = year === today.getFullYear() ? today.getMonth() : 11
    return perMonth.map((amount, i) => {
      running += amount
      return {
        month: format(new Date(year, i, 1), "MMM", { locale: dateLocale }),
        received: i <= lastMonth ? running : null,
      }
    })
  }, [inYear, year, today, rates, dateLocale])

  return (
    <div className="flex flex-col gap-4">
      <StatTiles
        items={[
          {
            key: "received",
            label: t("received"),
            value: rupiah(received),
            hint: t("yearN", { year }),
          },
          {
            key: "unpaid",
            label: t("unpaid"),
            value: rupiah(openTotal),
            hint: t("openInvoices", { n: open.length }),
          },
          {
            key: "spending",
            label: t("spending"),
            value: rupiah(spent),
            hint: t("subscriptionsAndCosts"),
          },
          {
            key: "goal",
            label: t("targetYear", { year }),
            value: goal ? (
              <button type="button" onClick={onSetGoal} className="text-left">
                {rupiah(goal)}
              </button>
            ) : (
              <button type="button" onClick={onSetGoal} className="text-left">
                {t("setGoal", { year })}
              </button>
            ),
            hint: goal
              ? t("percentReached", { n: Math.round((received / goal) * 100) })
              : t("noGoal"),
          },
        ]}
      />

      {unrated.length > 0 && (
        <p className="border-warning/40 text-warning rounded-lg border px-4 py-2.5 text-sm">
          {t("unratedOverview", { currencies: unrated.join(", ") })}
        </p>
      )}

      <HomeCard title={t("moneyIn")} badge={<YearBadge year={year} />}>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-56 w-full"
        >
          <AreaChart data={series} margin={{ left: 0, right: 0, top: 8 }}>
            <defs>
              <linearGradient id="fill-received" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-received)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-received)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              interval={0}
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={72}
              tickFormatter={(v: number) => rupiahShort(v, locale)}
            />
            {goal && (
              <ReferenceLine
                y={goal}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                label={{
                  value: t("targetAmount", {
                    amount: rupiahShort(goal, locale),
                  }),
                  position: "insideTopLeft",
                  fill: "var(--muted-foreground)",
                  fontSize: 12,
                }}
              />
            )}
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) =>
                active && payload?.[0]?.value != null ? (
                  <div className="bg-popover rounded-lg px-3 py-2 text-xs shadow-(--elev-4)">
                    <div className="text-muted-foreground">
                      {label} {year}
                    </div>
                    <div className="font-medium tabular-nums">
                      {rupiah(Number(payload[0].value))}
                    </div>
                  </div>
                ) : null
              }
            />
            <Area
              type="stepAfter"
              dataKey="received"
              stroke="var(--color-received)"
              strokeWidth={2}
              fill="url(#fill-received)"
              connectNulls={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </HomeCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <OpenInvoices open={open} rates={rates} today={today} />
        <MoneyReceived invoices={inYear} rates={rates} openTotal={openTotal} />
      </div>
    </div>
  )
}

function YearBadge({ year }: { year: number }) {
  return (
    <span className="text-tertiary-foreground text-sm tabular-nums">
      {year}
    </span>
  )
}

/** "Rp 4.500.000" for IDR; "US$2,000 · ≈ Rp 33,5 jt" for foreign invoices. */
function OwedAmount({ inv, rates }: { inv: InvoiceLite; rates: FxRates }) {
  const { rupiah, rupiahShort, money } = useMoneyFormat()
  const t = useT("finance")
  const locale = useLocale()
  if (inv.currency === "IDR") return <span>{rupiah(leftToPay(inv))}</span>
  const idr = openIdr(inv, rates)
  return (
    <span className="flex flex-col items-end">
      <span>{money(leftToPay(inv), inv.currency)}</span>
      <span className="text-muted-foreground text-[12px]">
        {idr ? `≈ ${rupiahShort(idr, locale)}` : t("noRate")}
      </span>
    </span>
  )
}

function OpenInvoices({
  open,
  rates,
  today,
}: {
  open: InvoiceLite[]
  rates: FxRates
  today: Date
}) {
  const { rupiahShort } = useMoneyFormat()
  const t = useT("finance")
  const locale = useLocale()
  const dateLocale = useDateLocale()
  const lateBy = (inv: InvoiceLite) =>
    differenceInCalendarDays(today, parseISO(inv.due_date))
  const buckets = [
    {
      key: "over30",
      label: t("over30"),
      color: "bg-red-9",
      items: open.filter((i) => lateBy(i) > 30),
    },
    {
      key: "late",
      label: t("late"),
      color: "bg-amber-9",
      items: open.filter((i) => lateBy(i) > 0 && lateBy(i) <= 30),
    },
    {
      key: "notYet",
      label: t("notDue"),
      color: "bg-muted-foreground/50",
      items: open.filter((i) => lateBy(i) <= 0),
    },
  ].map((b) => ({
    ...b,
    total: b.items.reduce((s, i) => s + openIdr(i, rates), 0),
  }))
  const total = buckets.reduce((s, b) => s + b.total, 0)

  return (
    <HomeCard
      title={t("unpaidInvoices")}
      badge={
        <span className="text-tertiary-foreground text-sm tabular-nums">
          {open.length}
        </span>
      }
    >
      <div className="flex flex-col gap-2">
        <div className="bg-muted flex h-1.5 overflow-hidden rounded-full">
          {total > 0 &&
            buckets.map((b) => (
              <span
                key={b.key}
                className={b.color}
                style={{ width: `${(b.total / total) * 100}%` }}
              />
            ))}
        </div>
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {buckets.map((b) => (
            <span key={b.key} className="flex items-center gap-1.5">
              <span className={cn("size-1.5 rounded-full", b.color)} />
              {b.label}
              <span className="text-foreground tabular-nums">
                {rupiahShort(b.total, locale)}
              </span>
            </span>
          ))}
        </div>
      </div>
      {open.length === 0 ? (
        <HomeEmpty>{t("noOpenBills")}</HomeEmpty>
      ) : (
        <div className="flex flex-col">
          {[...open]
            .sort((a, b) => a.due_date.localeCompare(b.due_date))
            .map((inv) => {
              const days = lateBy(inv)
              return (
                <HomeRow
                  key={inv.id}
                  href={
                    inv.project
                      ? `/projects/${inv.project.id}/invoices`
                      : undefined
                  }
                  leading={
                    <NameTile
                      name={clientOf(inv, t("noClient"))}
                      className="size-7"
                    />
                  }
                  title={clientOf(inv, t("noClient"))}
                  subtitle={
                    <>
                      {inv.invoice_number} ·{" "}
                      {t("dueOn", {
                        date: format(parseISO(inv.due_date), "d MMM", {
                          locale: dateLocale,
                        }),
                      })}{" "}
                      ·{" "}
                      <span
                        className={cn(
                          days > 30
                            ? "text-destructive"
                            : days > 0
                              ? "text-warning"
                              : "text-success",
                        )}
                      >
                        {days > 0
                          ? t("lateDays", { n: days })
                          : days === 0
                            ? t("dueToday")
                            : t("inDays", { n: -days })}
                      </span>
                    </>
                  }
                  trailing={<OwedAmount inv={inv} rates={rates} />}
                />
              )
            })}
        </div>
      )}
    </HomeCard>
  )
}

function MoneyReceived({
  invoices,
  rates,
  openTotal,
}: {
  invoices: InvoiceLite[]
  rates: FxRates
  openTotal: number
}) {
  const { rupiah, rupiahShort } = useMoneyFormat()
  const t = useT("finance")
  const locale = useLocale()
  const [by, setBy] = useState<"client" | "project">("client")
  const rows = useMemo(() => {
    const totals = new Map<string, number>()
    for (const inv of invoices) {
      const key =
        by === "client"
          ? clientOf(inv, t("noClient"))
          : inv.project?.name || t("noProject")
      totals.set(key, (totals.get(key) ?? 0) + receivedIdr(inv, rates))
    }
    return [...totals.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
  }, [invoices, by, rates, t])
  const received = rows.reduce((s, [, v]) => s + v, 0)
  const whole = received + openTotal
  const pct = (v: number) => (whole ? Math.round((v / whole) * 100) : 0)

  return (
    <HomeCard
      title={t("moneyInBySource")}
      actions={
        <SegmentedControl
          fitContent
          value={by}
          onChange={setBy}
          items={[
            { value: "client", label: t("byClient") },
            { value: "project", label: t("byProject") },
          ]}
        />
      }
    >
      {rows.length === 0 && openTotal === 0 ? (
        <HomeEmpty>{t("sourceEmpty")}</HomeEmpty>
      ) : (
        <>
          <Donut
            data={[
              ...rows.map(([key, value], i) => ({
                key,
                value,
                color: PALETTE[i % PALETTE.length],
              })),
              { key: "open", value: openTotal, color: "var(--muted)" },
            ]}
            label={rupiahShort(received, locale)}
            sublabel={t("percentIn", { n: pct(received) })}
          />
          <div className="flex flex-col">
            {rows.map(([name, value], i) => (
              <HomeRow
                key={name}
                leading={<NameTile name={name} className="size-7" />}
                title={name}
                subtitle={
                  <span className="bg-muted mt-1 block h-1.5 max-w-40 overflow-hidden rounded-full">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${pct(value)}%`,
                        background: PALETTE[i % PALETTE.length],
                      }}
                    />
                  </span>
                }
                trailing={
                  <>
                    <span className="text-muted-foreground text-[13px]">
                      {pct(value)}%
                    </span>
                    <span>{rupiah(value)}</span>
                  </>
                }
              />
            ))}
            {openTotal > 0 && (
              <HomeRow
                leading={
                  <span className="border-border size-7 rounded-md border border-dashed" />
                }
                title={
                  <span className="text-muted-foreground">{t("notInYet")}</span>
                }
                trailing={
                  <>
                    <span className="text-muted-foreground text-[13px]">
                      {pct(openTotal)}%
                    </span>
                    <span className="text-muted-foreground">
                      {rupiah(openTotal)}
                    </span>
                  </>
                }
              />
            )}
          </div>
        </>
      )}
    </HomeCard>
  )
}
