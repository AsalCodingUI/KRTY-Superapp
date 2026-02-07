"use client"

import { AdminAttendanceHistoryList } from "@/app/(main)/attendance/components/AdminAttendanceHistoryList"
import { createClient } from "@/shared/api/supabase/client"
import { canManageByRole } from "@/shared/lib/roles"
import { Database } from "@/shared/types/database.types"
import { TabNavigation, TabNavigationLink } from "@/shared/ui"
import { DataTable } from "@/shared/ui/data/DataTable"
import { RiCalendarCheckLine } from "@/shared/ui/lucide-icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  adminColumns,
  LeaveRequestWithProfile,
} from "./components/AdminColumns"
import { remainingLeaveColumns } from "./components/RemainingLeaveColumns"

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "job_title" | "leave_used" | "leave_balance"
>
type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]
type AttendanceLogWithProfile = AttendanceLog & {
  profiles: {
    full_name: string
    avatar_url: string | null
    job_title: string | null
  } | null
}

interface StakeholderLeavePageProps {
  requests: LeaveRequestWithProfile[]
  profiles: Profile[]
  attendanceLogs?: AttendanceLogWithProfile[]
  page: number
  pageSize: number
  totalCount: number
  role?: string
}

export function StakeholderLeavePage({
  requests,
  profiles,
  attendanceLogs = [],
  page,
  pageSize,
  totalCount,
  role,
}: StakeholderLeavePageProps) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<
    "approval" | "remaining" | "attendance"
  >(
    "attendance",
  )

  const canManage = canManageByRole(role)

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

  const handleApproveAttendanceDelete = async (logId: string) => {
    if (!confirm("Approve delete request for this attendance record?")) return

    const { error } = await supabase
      .from("attendance_logs")
      .delete()
      .eq("id", logId)

    if (error) {
      alert("Error deleting: " + error.message)
    } else {
      router.refresh()
    }
  }

  const approvalContent = (
    <section>
      <DataTable
        data={requests}
        columns={adminColumns(handleApprove, handleReject, {
          canSelect: canManage,
          canManage,
        })}
        showExport={false}
        showViewOptions={false}
        showFilterbar={false}
        onCreate={undefined}
        manualPagination={true}
        pageCount={pageCount}
        pageIndex={page - 1}
        onPageChange={handlePageChange}
        enableSelection={canManage}
        onDelete={
          canManage
            ? async (ids) => {
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
            }
            : undefined
        }
        showTableWrapper={false}
      />
    </section>
  )

  const remainingContent = (
    <RemainingLeaveView data={profiles} canManage={canManage} />
  )

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
        <RiCalendarCheckLine className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">
          Leave & Attendance Center
        </p>
      </div>

      <AttendanceOverviewPanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        attendanceLogs={attendanceLogs}
        leaveRequests={requests}
        approvalContent={approvalContent}
        remainingContent={remainingContent}
        onApproveAttendanceDelete={handleApproveAttendanceDelete}
      />
    </div>
  )
}

function AttendanceOverviewPanel({
  activeTab,
  onTabChange,
  attendanceLogs,
  leaveRequests,
  approvalContent,
  remainingContent,
  onApproveAttendanceDelete,
}: {
  activeTab: "approval" | "remaining" | "attendance"
  onTabChange: (tab: "approval" | "remaining" | "attendance") => void
  attendanceLogs: AttendanceLogWithProfile[]
  leaveRequests: LeaveRequestWithProfile[]
  approvalContent: React.ReactNode
  remainingContent: React.ReactNode
  onApproveAttendanceDelete: (logId: string) => void
}) {
  const today = new Date().toISOString().split("T")[0]

  const onLeaveToday = leaveRequests.filter(
    (req) =>
      req.status === "approved" &&
      req.start_date <= today &&
      req.end_date >= today,
  ).length

  const pendingRequests = leaveRequests.filter(
    (req) => req.status === "pending",
  ).length

  const totalApproved = leaveRequests.filter(
    (req) => req.status === "approved",
  ).length

  const presentToday = attendanceLogs.filter(
    (log) => log.date === today,
  ).length

  const currentlyActive = attendanceLogs.filter(
    (log) => log.date === today && !log.clock_out,
  ).length

  const stats = [
    { label: "On Leave Today", value: onLeaveToday },
    { label: "Pending Requests", value: pendingRequests },
    { label: "Total Approved", value: totalApproved },
    { label: "Present Today", value: presentToday },
    { label: "Currently Active", value: currentlyActive },
  ]

  return (
    <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
      <div className="grid grid-cols-1 gap-3 px-5 py-2 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((item) => (
          <div
            key={item.label}
            className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3"
          >
            <p className="text-label-sm text-foreground-secondary">
              {item.label}
            </p>
            <p className="text-heading-md text-foreground-primary">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="px-5 pt-2 border-b border-neutral-primary">
        <TabNavigation className="border-b-0">
          <TabNavigationLink
            active={activeTab === "attendance"}
            onClick={() => onTabChange("attendance")}
            showLeadingIcon={false}
          >
            Attendance History
          </TabNavigationLink>
          <TabNavigationLink
            active={activeTab === "approval"}
            onClick={() => onTabChange("approval")}
            showLeadingIcon={false}
          >
            Approvals Leave
          </TabNavigationLink>
          <TabNavigationLink
            active={activeTab === "remaining"}
            onClick={() => onTabChange("remaining")}
            showLeadingIcon={false}
          >
            Remaining Leave
          </TabNavigationLink>
        </TabNavigation>
      </div>

      <div className="p-5">
        {activeTab === "approval" && approvalContent}
        {activeTab === "remaining" && remainingContent}
        {activeTab === "attendance" && (
          <AdminAttendanceHistoryList
            logs={attendanceLogs}
            onApproveDelete={onApproveAttendanceDelete}
          />
        )}
      </div>
    </div>
  )
}

// --- SUB-COMPONENT (Sekarang lebih sederhana & cepat) ---
function RemainingLeaveView({
  data,
  canManage,
}: {
  data: Profile[]
  canManage: boolean
}) {
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
        enableSelection={canManage}
        onDelete={
          canManage
            ? async (ids) => {
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
            }
            : undefined
        }
        showTableWrapper={false}
      />
    </section>
  )
}
