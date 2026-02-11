"use client"

import { EmptyState } from "@/shared/ui/information/EmptyState"
import { RiFundsBoxLine } from "@/shared/ui/lucide-icons"

export function PayrollPage() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
        <RiFundsBoxLine className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">Payroll System</p>
      </div>

      <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
        <div className="p-5">
          <EmptyState
            title="Data Gaji & Pembayaran"
            description="Halaman sensitif. Nanti di sini ada data gaji semua karyawan."
          />
        </div>
      </div>
    </div>
  )
}
