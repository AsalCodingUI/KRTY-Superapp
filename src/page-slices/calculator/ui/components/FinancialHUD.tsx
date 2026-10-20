"use client"

import { Badge, Divider } from "@/shared/ui"
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
      <h4 className="text-label-md text-foreground">
        Financial Overview
      </h4>

      <div className="mt-6">
        <p className="text-label-sm text-muted-foreground">Net Profit</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <span className="text-heading-lg text-foreground">
            {formatIDR(netProfit)}
          </span>
          <Badge
            variant={
              isHealthy ? "success" : marginPercent > 0 ? "warning" : "error"
            }
          >
            {marginPercent.toFixed(1)}% Margin
          </Badge>
        </div>
      </div>

      <Divider className="my-6" />

      <ul role="list" className="space-y-3">
        <li className="flex items-center justify-between">
          <span className="text-label-md text-muted-foreground">
            Gross Revenue
          </span>
          <span className="text-label-md text-foreground">
            {formatIDR(grossRevenue)}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-label-md text-muted-foreground">
            Labor Cost (Salary)
          </span>
          <span className="text-label-md text-destructive">
            -{formatIDR(totalLaborCost)}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-label-md text-muted-foreground">
            Overhead (Portion)
          </span>
          <span className="text-label-md text-destructive">
            -{formatIDR(overheadCost)}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-label-md text-muted-foreground">
            COGS (Freelance)
          </span>
          <span className="text-label-md text-destructive">
            -{formatIDR(freelanceCost)}
          </span>
        </li>
        <li className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-label-md text-muted-foreground">
            Total Cost
          </span>
          <span className="text-label-md text-foreground">
            {formatIDR(totalCost)}
          </span>
        </li>
      </ul>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-label-md text-muted-foreground">
            Current Margin
          </span>
          <span className="text-label-md text-foreground">
            {marginPercent.toFixed(1)}%
          </span>
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-label-md text-muted-foreground">
            Pricing Suggestion
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-label-md text-muted-foreground">
                Break-even Price
              </span>
              <span className="text-label-md text-foreground">
                {formatIDR(totalCost)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-label-md text-muted-foreground">
                Suggested Price ({targetMargin.toFixed(0)}% margin)
              </span>
              <span className={`text-label-md ${isHealthy ? "text-success" : "text-destructive"}`}>
                {formatIDR(suggestedPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border-border mt-6 flex items-center gap-3 rounded-md border p-3 shadow-sm">
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
        <span className="text-body-xs text-muted-foreground">
          {isHealthy
            ? "Margin meets target. Pricing looks healthy."
            : "Margin is below target. Consider adjusting scope or price."}
        </span>
      </div>
    </div>
  )
}
