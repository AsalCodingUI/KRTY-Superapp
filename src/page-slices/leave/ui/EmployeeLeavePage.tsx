"use client"

import { columns } from "./components/Columns"
import { LeaveRequestModal } from "./components/LeaveRequestModal"
import { LeaveStats } from "./components/LeaveStats"
import { createClient } from "@/shared/api/supabase/client"
import { Database } from "@/shared/types/database.types"
import { DataTable } from "@/shared/ui/data/DataTable"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

interface EmployeeLeavePageProps {
  profile: Profile
  requests: LeaveRequest[]
  page: number
  pageSize: number
  totalCount: number
}

export function EmployeeLeavePage({
  profile,
  requests,
  page,
  pageSize,
  totalCount,
}: EmployeeLeavePageProps) {
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
    <>
      <div className="mb-6">
        <h1 className="text-content dark:text-content text-heading-md sm:text-heading-lg">
          Leave & Permission
        </h1>
      </div>

      {/* 2. STATS SECTION (Passing 'requests' agar hitungannya Realtime) */}
      <section className="mb-6">
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

      <LeaveRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingItem}
        userProfile={profile}
      />
    </>
  )
}
