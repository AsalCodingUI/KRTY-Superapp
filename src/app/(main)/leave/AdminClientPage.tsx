"use client"

import { DataTable, TabNavigation, TabNavigationLink } from "@/shared/ui"
import { Database } from "@/shared/types/database.types"
import { createClient } from "@/shared/api/supabase/client"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  adminColumns,
  LeaveRequestWithProfile,
} from "@/page-slices/leave/ui/components/AdminColumns"
import { LeaveAdminStats } from "@/page-slices/leave/ui/components/LeaveAdminStats"
import { remainingLeaveColumns } from "@/page-slices/leave/ui/components/RemainingLeaveColumns"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export default function LeaveAdminPage({
  requests,
  profiles, // Terima data profiles dari Server
  page,
  pageSize,
  totalCount,
}: {
  requests: LeaveRequestWithProfile[]
  profiles: Profile[] // Tipe data baru
  page: number
  pageSize: number
  totalCount: number
}) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<"approval" | "remaining">(
    "approval",
  )

  // --- LOGIC REALTIME (SUPER CEPAT) ---
  useEffect(() => {
    const channel = supabase
      .channel("admin-realtime-dashboard")
      // 1. Dengar perubahan di tabel LEAVE REQUESTS
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leave_requests" },
        () => router.refresh(),
      )
      // 2. Dengar perubahan di tabel PROFILES (Update sisa cuti)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => router.refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", (newPage + 1).toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const pageCount = Math.ceil(totalCount / pageSize)

  const handleApprove = async (id: number) => {
    if (!confirm("Approve this request?")) return
    const { error } = await supabase
      .from("leave_requests")
      .update({ status: "approved" })
      .eq("id", id)
    if (error) alert("Error approving: " + error.message)
  }

  const handleReject = async (id: number) => {
    if (!confirm("Reject this request?")) return
    const { error } = await supabase
      .from("leave_requests")
      .update({ status: "rejected" })
      .eq("id", id)
    if (error) alert("Error rejecting: " + error.message)
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-content dark:text-content text-lg font-semibold sm:text-xl">
          Leave Approval Center
        </h1>

        <TabNavigation className="mt-6">
          <TabNavigationLink
            active={activeTab === "approval"}
            onClick={() => setActiveTab("approval")}
            className="cursor-pointer"
          >
            Approvals
          </TabNavigationLink>
          <TabNavigationLink
            active={activeTab === "remaining"}
            onClick={() => setActiveTab("remaining")}
            className="cursor-pointer"
          >
            Remaining Leave
          </TabNavigationLink>
        </TabNavigation>
      </div>

      {activeTab === "approval" ? (
        <>
          <section className="mb-6">
            <LeaveAdminStats requests={requests} />
          </section>

          <section>
            <DataTable
              data={requests}
              columns={adminColumns(handleApprove, handleReject)}
              showExport={false}
              showViewOptions={false}
              showFilterbar={false}
              onCreate={undefined}
              manualPagination={true}
              pageCount={pageCount}
              pageIndex={page - 1}
              onPageChange={handlePageChange}
              onDelete={async (ids) => {
                if (!confirm(`Delete ${ids.length} leave request(s)?`)) return
                const { error } = await supabase
                  .from("leave_requests")
                  .delete()
                  .in("id", ids as number[])
                if (error) {
                  alert("Error deleting: " + error.message)
                } else {
                  router.refresh()
                }
              }}
              showTableWrapper={true}
              tableTitle="Leave Approvals"
              tableDescription="Review and approve employee leave requests"
            />
          </section>
        </>
      ) : (
        // Kirim data profiles yang sudah realtime dari parent
        <RemainingLeaveView data={profiles} />
      )}
    </>
  )
}

// --- SUB-COMPONENT (Sekarang lebih sederhana & cepat) ---
function RemainingLeaveView({ data }: { data: Profile[] }) {
  const supabase = createClient()
  const router = useRouter()

  return (
    <section>
      <DataTable
        data={data}
        columns={remainingLeaveColumns}
        showExport={false}
        showViewOptions={false}
        showFilterbar={false}
        actionLabel=""
        onDelete={async (ids) => {
          if (!confirm(`Delete ${ids.length} employee profile(s)?`)) return

          const { error } = await supabase
            .from("profiles")
            .delete()
            .in("id", ids as string[])
          if (error) {
            console.error("Delete error:", error)
            alert("Error deleting: " + error.message)
          } else {
            router.refresh()
          }
        }}
        showTableWrapper={true}
        tableTitle="Remaining Leave Quota"
        tableDescription="Monitor employee leave balances and usage"
      />
    </section>
  )
}
