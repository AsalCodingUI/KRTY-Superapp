"use client"

import { Badge, Divider } from "@/shared/ui"
import { RiAlertFill, RiCheckboxCircleFill } from "@remixicon/react"

interface FinancialHUDProps {
  grossRevenue: number
  totalLaborCost: number
  platformFee: number
  platformFeePercent: number
  netProfit: number
  marginPercent: number
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
  platformFee,
  platformFeePercent,
  netProfit,
  marginPercent,
}: FinancialHUDProps) {
  const isHealthy = marginPercent > 30

  return (
    <div className="sticky top-8">
      <h4 className="text-label-md text-content dark:text-content">
        Financial Overview
      </h4>

      <div className="mt-6">
        <p className="text-label-md text-content-subtle dark:text-content-subtle">
          Net Profit (Estimated)
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <span className="text-display-xxs text-content dark:text-content">
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

      <ul role="list" className="text-body-sm space-y-3">
        <li className="flex items-center justify-between">
          <span className="text-content-subtle dark:text-content-placeholder">
            Gross Revenue
          </span>
          <span className="text-content dark:text-content font-medium">
            {formatIDR(grossRevenue)}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-content-subtle dark:text-content-placeholder">
            Labor Cost (COGS)
          </span>
          <span className="text-danger font-medium">
            -{formatIDR(totalLaborCost)}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-content-subtle dark:text-content-placeholder">
            Platform Fee ({platformFeePercent}%)
          </span>
          <span className="text-danger font-medium">
            -{formatIDR(platformFee)}
          </span>
        </li>
      </ul>

      <div className="bg-surface border-border dark:bg-surface mt-6 flex items-center gap-3 rounded-md border p-3 shadow-sm">
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
        <span className="text-body-xs text-content-subtle dark:text-content-placeholder">
          {isHealthy
            ? "Profitability is optimal (>30%). You are good to go!"
            : "Margin is below recommended target. Consider adjusting timeline or budget."}
        </span>
      </div>
    </div>
  )
}
