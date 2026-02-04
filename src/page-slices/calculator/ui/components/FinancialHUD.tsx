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
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

export function FinancialHUD({
    grossRevenue,
    totalLaborCost,
    platformFee,
    platformFeePercent,
    netProfit,
    marginPercent
}: FinancialHUDProps) {
    const isHealthy = marginPercent > 30

    return (
        <div className="sticky top-8">
            <h4 className="text-sm font-semibold text-content dark:text-content">
                Financial Overview
            </h4>

            <div className="mt-6">
                <p className="text-sm font-medium text-content-subtle dark:text-content-subtle">Net Profit (Estimated)</p>
                <div className="flex flex-wrap items-baseline gap-3 mt-1">
                    <span className="text-2xl font-semibold text-content dark:text-content">
                        {formatIDR(netProfit)}
                    </span>
                    <Badge variant={isHealthy ? "success" : marginPercent > 0 ? "warning" : "error"}>
                        {marginPercent.toFixed(1)}% Margin
                    </Badge>
                </div>
            </div>

            <Divider className="my-6" />

            <ul role="list" className="space-y-3 text-sm">
                <li className="flex justify-between items-center">
                    <span className="text-content-subtle dark:text-content-placeholder">Gross Revenue</span>
                    <span className="font-medium text-content dark:text-content">{formatIDR(grossRevenue)}</span>
                </li>
                <li className="flex justify-between items-center">
                    <span className="text-content-subtle dark:text-content-placeholder">Labor Cost (COGS)</span>
                    <span className="font-medium text-danger">-{formatIDR(totalLaborCost)}</span>
                </li>
                <li className="flex justify-between items-center">
                    <span className="text-content-subtle dark:text-content-placeholder">Platform Fee ({platformFeePercent}%)</span>
                    <span className="font-medium text-danger">-{formatIDR(platformFee)}</span>
                </li>
            </ul>

            <div className="mt-6 flex items-center gap-3 rounded-md bg-surface p-3 shadow-sm border border-border dark:bg-surface">
                {isHealthy ? (
                    <RiCheckboxCircleFill
                        className="size-5 shrink-0 text-success"
                        aria-hidden={true}
                    />
                ) : (
                    <RiAlertFill
                        className="size-5 shrink-0 text-warning"
                        aria-hidden={true}
                    />
                )}
                <span className="text-xs text-content-subtle dark:text-content-placeholder">
                    {isHealthy
                        ? "Profitability is optimal (>30%). You are good to go!"
                        : "Margin is below recommended target. Consider adjusting timeline or budget."}
                </span>
            </div>
        </div>
    )
}