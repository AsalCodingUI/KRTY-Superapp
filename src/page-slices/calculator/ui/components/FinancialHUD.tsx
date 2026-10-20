"use client"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  const isHealthy = marginPercent >= targetMargin

  return (
    <div className="sticky top-4 sm:top-8">
      <h4 className="text-foreground text-sm font-medium">
        Financial Overview
      </h4>

      <div className="mt-6">
        <p className="text-muted-foreground text-sm font-medium">Net Profit</p>
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
            {marginPercent.toFixed(1)}% Margin
          </Badge>
        </div>
      </div>

      <Separator className="my-6" />

      <ul role="list" className="space-y-3">
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">
            Gross Revenue
          </span>
          <span className="text-foreground text-sm font-medium">
            {formatIDR(grossRevenue)}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">
            Labor Cost (Salary)
          </span>
          <span className="text-destructive text-sm font-medium">
            -{formatIDR(totalLaborCost)}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">
            Overhead (Portion)
          </span>
          <span className="text-destructive text-sm font-medium">
            -{formatIDR(overheadCost)}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">
            COGS (Freelance)
          </span>
          <span className="text-destructive text-sm font-medium">
            -{formatIDR(freelanceCost)}
          </span>
        </li>
        <li className="border-border flex items-center justify-between border-t pt-3">
          <span className="text-muted-foreground text-sm font-medium">
            Total Cost
          </span>
          <span className="text-foreground text-sm font-medium">
            {formatIDR(totalCost)}
          </span>
        </li>
      </ul>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">
            Current Margin
          </span>
          <span className="text-foreground text-sm font-medium">
            {marginPercent.toFixed(1)}%
          </span>
        </div>
        <div className="border-border border-t pt-4">
          <p className="text-muted-foreground text-sm font-medium">
            Pricing Suggestion
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">
                Break-even Price
              </span>
              <span className="text-foreground text-sm font-medium">
                {formatIDR(totalCost)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">
                Suggested Price ({targetMargin.toFixed(0)}% margin)
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

      <div className="border-border mt-6 flex items-center gap-3 rounded-md border p-3 shadow-sm">
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
          {isHealthy
            ? "Margin meets target. Pricing looks healthy."
            : "Margin is below target. Consider adjusting scope or price."}
        </span>
      </div>
    </div>
  )
}
