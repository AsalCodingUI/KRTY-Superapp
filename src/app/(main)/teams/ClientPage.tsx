"use client"

import { Database } from "@/shared/types/database.types"
import { createClient } from "@/shared/api/supabase/client"
import { useState } from "react"
import { createTeamColumns } from "./Columns"
import { TeamFormDialog } from "./components/TeamDialogs"
import { TeamStats } from "./components/TeamStats"
import { canManageByRole } from "@/shared/lib/roles"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { DataTable } from "@/shared/ui"
import { RiGroupLine } from "@/shared/ui/lucide-icons"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export function TeamsClientPage({
  initialData,
  page,
  pageSize,
  totalCount,
  role,
}: {
  initialData: Profile[]
  page: number
  pageSize: number
  totalCount: number
  role?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Profile | null>(null)

  const canManage = canManageByRole(role)

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", (newPage + 1).toString()) // Convert 0-index to 1-index
    router.push(`${pathname}?${params.toString()}`)
  }

  const pageCount = Math.ceil(totalCount / pageSize)

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
        <RiGroupLine className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">Team Members</p>
      </div>

      <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
        <div className="space-y-6 p-5">
          {/* POSISI BARU: DI BAWAH JUDUL */}
          <section>
            <TeamStats data={initialData} />
          </section>

          <div>
            <DataTable
              data={initialData}
              columns={createTeamColumns({ canSelect: canManage })}
              manualPagination={true}
              pageCount={pageCount}
              pageIndex={page - 1} // Convert 1-index to 0-index
              onPageChange={handlePageChange}
              enableSelection={canManage}
              onCreate={
                canManage
                  ? () => {
                      setEditingItem(null)
                      setIsAddOpen(true)
                    }
                  : undefined
              }
              onEdit={
                canManage
                  ? (item) => {
                      setEditingItem(item)
                      setIsAddOpen(true)
                    }
                  : undefined
              }
              onDelete={
                canManage
                  ? async (ids) => {
                      if (!confirm(`Delete ${ids.length} team member(s)?`))
                        return
                      const supabase = createClient()
                      const { error } = await supabase
                        .from("profiles")
                        .delete()
                        .in("id", ids as string[])
                      if (error) {
                        alert("Error deleting: " + error.message)
                      } else {
                        router.refresh()
                      }
                    }
                  : undefined
              }
              showTableWrapper={true}
              tableTitle="Team Members"
              tableDescription="Manage your team members and their roles"
            />
          </div>
        </div>
      </div>

      {canManage && (
        <TeamFormDialog
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          initialData={editingItem}
        />
      )}
    </div>
  )
}
