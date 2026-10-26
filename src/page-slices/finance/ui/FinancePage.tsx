"use client"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Eye, EyeOff, FileText } from "@/components/icons"
import { ArrowLeftRight, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HideMoneyProvider, useHideMoney } from "../model/hide-money"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { RiAddLine, RiMoreFill, RiWalletLine } from "@/shared/ui/lucide-icons"
import { parseISO } from "date-fns"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Subscription } from "@/entities/finance/lib/money"
import {
  useFinanceGoal,
  useFinanceInvoices,
  useFirstInvoiceYear,
  useFxRates,
  useSubscriptions,
} from "../model/data"

function TabFallback() {
  return (
    <div className="flex justify-center py-24">
      <Spinner className="size-6" />
    </div>
  )
}

// Each tab is its own chunk: Subscriptions never loads recharts. Dialogs load
// the first time they open.
const OverviewTab = dynamic(
  () => import("./OverviewTab").then((m) => m.OverviewTab),
  { loading: TabFallback },
)
const SubscriptionsTab = dynamic(
  () => import("./SubscriptionsTab").then((m) => m.SubscriptionsTab),
  { loading: TabFallback },
)
const SubscriptionDialog = dynamic(
  () => import("./SubscriptionDialog").then((m) => m.SubscriptionDialog),
  { loading: () => null },
)
const FxRatesDialog = dynamic(
  () => import("./FxRatesDialog").then((m) => m.FxRatesDialog),
  { loading: () => null },
)
const GoalDialog = dynamic(
  () => import("./GoalDialog").then((m) => m.GoalDialog),
  { loading: () => null },
)

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
  const tc = useT("common")
  const router = useRouter()
  const { profile, loading } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  const invoices = useFinanceInvoices(year)
  const firstInvoiceYear = useFirstInvoiceYear()
  const subscriptions = useSubscriptions()
  const goal = useFinanceGoal(year)
  const fx = useFxRates()
  const rates = fx.data ?? {}

  const [editing, setEditing] = useState<Subscription | null>(null)
  const [subOpen, setSubOpen] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const [fxOpen, setFxOpen] = useState(false)
  const subMounted = useMountOnce(subOpen)
  const fxMounted = useMountOnce(fxOpen)
  const goalMounted = useMountOnce(goalOpen)

  const openSubscription = (sub: Subscription | null) => {
    setEditing(sub)
    setSubOpen(true)
  }

  // Years with data, plus this year and the next.
  const firstYear = Math.min(
    currentYear,
    firstInvoiceYear.data ?? currentYear,
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
      <PageHeader
        className="pt-6"
        title={t("title")}
        actions={
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
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={tc("moreActions")}
                    className="text-muted-foreground"
                  />
                }
              >
                <RiMoreFill />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem onClick={() => setGoalOpen(true)}>
                  <Target />
                  {t("actionGoal", { year })}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFxOpen(true)}>
                  <ArrowLeftRight />
                  {t("actionFx")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/projects")}>
                  <FileText />
                  {t("actionInvoices")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              aria-label={t("actionAddSubscription")}
              onClick={() => openSubscription(null)}
            >
              <RiAddLine data-icon="inline-start" />
              {/* Icon only on phones, or the header runs off screen. */}
              <span className="hidden sm:inline">
                {t("actionAddSubscription")}
              </span>
            </Button>
          </>
        }
      />

      <TabNavigation>
        {(["overview", "subscriptions"] as const).map((value) => (
          <TabNavigationLink
            key={value}
            active={tab === value}
            onClick={() => router.push(TAB_HREF[value], { scroll: false })}
            showLeadingIcon={false}
          >
            {value === "overview" ? t("tabOverview") : t("tabSubscriptions")}
          </TabNavigationLink>
        ))}
      </TabNavigation>

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

      {/* Mounted on first open, then kept so close animations play. */}
      {subMounted && (
        <SubscriptionDialog
          subscription={editing}
          rates={rates}
          open={subOpen}
          onOpenChange={setSubOpen}
        />
      )}
      {fxMounted && (
        <FxRatesDialog rates={rates} open={fxOpen} onOpenChange={setFxOpen} />
      )}
      {goalMounted && (
        <GoalDialog
          key={`${year}-${goal.data ?? ""}`}
          year={year}
          current={goal.data ?? null}
          open={goalOpen}
          onOpenChange={setGoalOpen}
        />
      )}
    </div>
  )
}

/** True from the first time `open` is true onwards. */
function useMountOnce(open: boolean) {
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  return mounted
}
