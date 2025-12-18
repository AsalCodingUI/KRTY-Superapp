import { EmptyState } from "@/components/EmptyState"

export default function PayrollPage() {
    return (
        <div>
            <h1 className="text-lg font-semibold text-content sm:text-xl dark:text-content mb-6">
                Payroll System
            </h1>
            <EmptyState
                title="Data Gaji & Pembayaran"
                description="Halaman sensitif. Nanti di sini ada data gaji semua karyawan."
            />
        </div>
    )
}