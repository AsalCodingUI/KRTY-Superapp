"use client"

import { EmptyState } from "@/shared/ui/information/EmptyState"

export function PayrollPage() {
  return (
    <div>
      <h1 className="text-content dark:text-content text-heading-md sm:text-heading-lg mb-6">
        Payroll System
      </h1>
      <EmptyState
        title="Data Gaji & Pembayaran"
        description="Halaman sensitif. Nanti di sini ada data gaji semua karyawan."
      />
    </div>
  )
}
