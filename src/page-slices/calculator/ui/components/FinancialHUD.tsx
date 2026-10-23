"use client"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useT } from "@/shared/i18n/client"
import { RiAlertFill, RiCheckboxCircleFill } from "@/shared/ui/lucide-icons"

interface FinancialHUDProps {
  grossRevenue: number
  totalLaborCost: number
  overheadCost: number
  freelanceCost: number
  totalCost: number
  netProfit: number
  marginPercent: number
  targetMargin: number
  suggestedPrice: number
}

const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)

export function FinancialHUD({
  grossRevenue,
  totalLaborCost,
  overheadCost,
  freelanceCost,
  totalCost,
  netProfit,
  marginPercent,
  targetMargin,
  suggestedPrice,
}: FinancialHUDProps) {
  const t = useT("calculator")
  const isHealthy = marginPercent >= targetMargin

  return (
    <div className="sticky top-4 sm:top-8">
      <h4 className="text-foreground text-sm font-medium">
        {t("financialOverview")}
      </h4>

      <div className="mt-6">
        <p className="text-muted-foreground text-sm font-medium">
          {t("netProfit")}
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <span className="text-foreground text-xl font-semibold">
            {formatIDR(netProfit)}
          </span>
          <Badge
            variant={
              isHealthy
                ? "success"
                : marginPercent > 0
                  ? "warning"
                  : "destructive"
            }
          >
            {t("marginBadge", { value: marginPercent.toFixed(1) })}
          </Badge>
        </div>
      </div>

      <Separator className="my-6" />

      <ul role="list" className="space-y-3">
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">
            {t("grossRevenue")}
          </span>
          <span className="text-foreground text-sm font-medium">
            {formatIDR(grossRevenue)}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">
            {t("laborCost")}
          </span>
          <span className="text-destructive text-sm font-medium">
            -{formatIDR(totalLaborCost)}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">
            {t("overheadPortion")}
          </span>
          <span className="text-destructive text-sm font-medium">
            -{formatIDR(overheadCost)}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">
            {t("cogsFreelance")}
          </span>
          <span className="text-destructive text-sm font-medium">
            -{formatIDR(freelanceCost)}
          </span>
        </li>
        <li className="border-border flex items-center justify-between border-t pt-3">
          <span className="text-muted-foreground text-sm font-medium">
            {t("totalCost")}
          </span>
          <span className="text-foreground text-sm font-medium">
            {formatIDR(totalCost)}
          </span>
        </li>
      </ul>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">
            {t("currentMargin")}
          </span>
          <span className="text-foreground text-sm font-medium">
            {marginPercent.toFixed(1)}%
          </span>
        </div>
        <div className="border-border border-t pt-4">
          <p className="text-muted-foreground text-sm font-medium">
            {t("pricingSuggestion")}
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">
                {t("breakEvenPrice")}
              </span>
              <span className="text-foreground text-sm font-medium">
                {formatIDR(totalCost)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">
                {t("suggestedPrice", { value: targetMargin.toFixed(0) })}
              </span>
              <span
                className={`text-label-md ${isHealthy ? "text-success" : "text-destructive"}`}
              >
                {formatIDR(suggestedPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-foreground/[0.03] mt-6 flex items-center gap-3 rounded-md p-3 shadow-sm">
        {isHealthy ? (
          <RiCheckboxCircleFill
            className="text-success size-5 shrink-0"
            aria-hidden={true}
          />
        ) : (
          <RiAlertFill
            className="text-warning size-5 shrink-0"
            aria-hidden={true}
          />
        )}
        <span className="text-muted-foreground text-xs">
          {isHealthy ? t("marginHealthy") : t("marginBelowTarget")}
        </span>
      </div>
    </div>
  )
}
