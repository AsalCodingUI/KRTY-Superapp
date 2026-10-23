"use client"

import { EmptyState } from "@/components/empty-state"
import {
  HomeAction,
  HomeActions,
} from "@/app/(main)/dashboard/components/home-card"
import { PageHeader } from "@/components/page-header"
import { ArrowLeftRight, Eye, EyeOff, FileText, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HideMoneyProvider, useHideMoney } from "../model/hide-money"
import { SegmentedControl } from "@/components/segmented-control"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { canManageByRole } from "@/shared/lib/roles"
import { RiAddLine, RiWalletLine } from "@/shared/ui/lucide-icons"
import { parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Subscription } from "@/entities/finance/lib/money"
import {
  useFinanceGoal,
  useFinanceInvoices,
  useFxRates,
  useSubscriptions,
} from "../model/data"
import { FxRatesDialog } from "./FxRatesDialog"
import { GoalDialog } from "./GoalDialog"
import { OverviewTab } from "./OverviewTab"
import { SubscriptionDialog } from "./SubscriptionDialog"
import { SubscriptionsTab } from "./SubscriptionsTab"

export type FinanceTab = "overview" | "subscriptions"

const TAB_HREF: Record<FinanceTab, string> = {
  overview: "/finance",
  subscriptions: "/finance/subscriptions",
}

/** Stakeholder finance: money in (invoices) and recurring costs. */
export function FinancePage({ tab }: { tab: FinanceTab }) {
  return (
    <HideMoneyProvider>
      <FinanceContent tab={tab} />
    </HideMoneyProvider>
  )
}

function FinanceContent({ tab }: { tab: FinanceTab }) {
  const { hidden, toggle } = useHideMoney()
  const t = useT("finance")
  const router = useRouter()
  const { profile, loading } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  const invoices = useFinanceInvoices()
  const subscriptions = useSubscriptions()
  const goal = useFinanceGoal(year)
  const fx = useFxRates()
  const rates = fx.data ?? {}

  const [editing, setEditing] = useState<Subscription | null>(null)
  const [subOpen, setSubOpen] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const [fxOpen, setFxOpen] = useState(false)

  const openSubscription = (sub: Subscription | null) => {
    setEditing(sub)
    setSubOpen(true)
  }

  // Years with data, plus this year and the next.
  const firstYear = Math.min(
    currentYear,
    ...(invoices.data ?? []).map((i) => parseISO(i.issue_date).getFullYear()),
    ...(subscriptions.data ?? []).map((s) =>
      parseISO(s.anchor_date).getFullYear(),
    ),
  )
  const years: number[] = []
  for (let y = currentYear + 1; y >= firstYear; y--) years.push(y)

  if (!loading && !isAdmin) {
    return (
      <EmptyState
        className="mt-10"
        icon={<RiWalletLine />}
        title={t("stakeholderOnly")}
        description={t("stakeholderOnlyDescription")}
      />
    )
  }

  const busy =
    loading || invoices.isLoading || subscriptions.isLoading || fx.isLoading

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader className="pt-6" title={t("title")} />

      <HomeActions
        aside={
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-pressed={hidden}
                    aria-label={hidden ? t("showAmounts") : t("hideAmounts")}
                    onClick={toggle}
                    className="text-muted-foreground"
                  />
                }
              >
                {hidden ? <EyeOff /> : <Eye />}
              </TooltipTrigger>
              <TooltipContent>
                {hidden ? t("showAmounts") : t("hideAmounts")}
              </TooltipContent>
            </Tooltip>
            <Select
              value={String(year)}
              onValueChange={(v) => v && setYear(Number(v))}
            >
              <SelectTrigger className="w-36" aria-label={t("year")}>
                <SelectValue>
                  {(v: string) =>
                    Number(v) === currentYear ? t("thisYear") : v
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y === currentYear ? t("thisYearWith", { year: y }) : y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SegmentedControl
              fitContent
              value={tab}
              onChange={(next) =>
                router.push(TAB_HREF[next], { scroll: false })
              }
              items={[
                { value: "overview", label: t("tabOverview") },
                { value: "subscriptions", label: t("tabSubscriptions") },
              ]}
            />
          </>
        }
      >
        <HomeAction
          primary
          icon={<RiAddLine />}
          onClick={() => openSubscription(null)}
        >
          {t("actionAddSubscription")}
        </HomeAction>
        <HomeAction icon={<Target />} onClick={() => setGoalOpen(true)}>
          {t("actionGoal", { year })}
        </HomeAction>
        <HomeAction icon={<ArrowLeftRight />} onClick={() => setFxOpen(true)}>
          {t("actionFx")}
        </HomeAction>
        <HomeAction icon={<FileText />} href="/projects">
          {t("actionInvoices")}
        </HomeAction>
      </HomeActions>

      {busy ? (
        <div className="flex justify-center py-24">
          <Spinner className="size-6" />
        </div>
      ) : invoices.error || subscriptions.error ? (
        <EmptyState
          icon={<RiWalletLine />}
          title={t("loadFailed")}
          description={t("loadFailedHint")}
        />
      ) : tab === "overview" ? (
        <OverviewTab
          invoices={invoices.data ?? []}
          subscriptions={subscriptions.data ?? []}
          rates={rates}
          year={year}
          goal={goal.data ?? null}
          onSetGoal={() => setGoalOpen(true)}
        />
      ) : (
        <SubscriptionsTab
          key={year}
          subscriptions={subscriptions.data ?? []}
          rates={rates}
          year={year}
          onAdd={() => openSubscription(null)}
          onEdit={openSubscription}
        />
      )}

      <SubscriptionDialog
        subscription={editing}
        rates={rates}
        open={subOpen}
        onOpenChange={setSubOpen}
      />
      <FxRatesDialog rates={rates} open={fxOpen} onOpenChange={setFxOpen} />
      <GoalDialog
        key={`${year}-${goal.data ?? ""}`}
        year={year}
        current={goal.data ?? null}
        open={goalOpen}
        onOpenChange={setGoalOpen}
      />
    </div>
  )
}
