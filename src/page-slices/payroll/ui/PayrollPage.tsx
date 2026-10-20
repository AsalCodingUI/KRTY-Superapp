"use client"

import { EmptyState } from "@/components/empty-state"

export function PayrollPage() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 pb-4">
        <h1 className="text-foreground truncate text-xl font-semibold tracking-tight">
          Payroll System
        </h1>
      </div>

      <div className="flex flex-col">
        <div className="p-5">
          <EmptyState
            title="Payroll data unavailable"
            description="Payroll records will appear here."
            placement="inner"
          />
        </div>
      </div>
    </div>
  )
}
