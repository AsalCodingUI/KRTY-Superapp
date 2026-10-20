"use client"

import { toast } from "sonner"
import { createClient } from "@/shared/api/supabase/client"
import { canManageByRole } from "@/shared/lib/roles"
import { Database } from "@/shared/types/database.types"
import { useState } from "react"
import { createTeamColumns } from "./Columns"
import { TeamFormDialog } from "./components/TeamDialogs"
import { TeamStats } from "./components/TeamStats"

import { DataTable } from "@/components/data-table"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

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
      <div className="flex items-center gap-2 pb-4">
        <h1 className="text-foreground truncate text-xl font-semibold tracking-tight">
          Team Members
        </h1>
      </div>

      <div className="flex flex-col">
        <div className="space-y-4 p-5">
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
                        toast.error("Error deleting: " + error.message)
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
