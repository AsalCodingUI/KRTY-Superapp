"use client"

import { Database } from "@/shared/types/database.types"
import { createClient } from "@/shared/api/supabase/client"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { columns } from "@/page-slices/leave/ui/components/Columns"
import { LeaveRequestModal } from "@/page-slices/leave/ui/components/LeaveRequestModal"
import { LeaveStats } from "@/page-slices/leave/ui/components/LeaveStats"
import { DataTable } from "@/shared/ui"
import { RiCalendarLine } from "@/shared/ui/lucide-icons"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

export default function LeaveClientPage({
  profile,
  requests,
  page,
  pageSize,
  totalCount,
}: {
  profile: Profile
  requests: LeaveRequest[]
  page: number
  pageSize: number
  totalCount: number
}) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LeaveRequest | null>(null)

  // --- 1. LOGIC REALTIME (Agar otomatis refresh saat status berubah/diedit) ---
  useEffect(() => {
    const channel = supabase
      .channel("employee-leave-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Dengarkan semua event (INSERT, UPDATE)
          schema: "public",
          table: "leave_requests",
          filter: `user_id=eq.${profile.id}`, // Hanya dengarkan data milik user ini
        },
        () => {
          // Refresh halaman server component
          router.refresh()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router, profile.id])

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", (newPage + 1).toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const pageCount = Math.ceil(totalCount / pageSize)

  // Open Edit Modal
  const handleEdit = (item: LeaveRequest) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  // Open Add Modal
  const handleAdd = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
        <RiCalendarLine className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">
          Leave &amp; Permission
        </p>
      </div>

      <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
        <div className="space-y-6 p-5">
          {/* 2. STATS SECTION (Passing 'requests' agar hitungannya Realtime) */}
          <section>
            <LeaveStats requests={requests} />
          </section>

          <section>
            <DataTable
              data={requests}
              columns={columns(handleEdit)}
              manualPagination={true}
              pageCount={pageCount}
              pageIndex={page - 1}
              onPageChange={handlePageChange}
              onCreate={handleAdd}
              showExport={false}
              showViewOptions={false}
              actionLabel="Request Leave"
              enableSelection={false}
              enableHover={false}
              searchKey="reason"
              showTableWrapper={true}
              tableTitle="Leave Requests"
              tableDescription="View and manage your leave applications"
            />
          </section>
        </div>
      </div>

      <LeaveRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingItem}
        userProfile={profile}
      />
    </div>
  )
}
