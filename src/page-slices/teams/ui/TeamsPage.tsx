"use client"

import { createTeamColumns } from "@/app/(main)/teams/Columns"
import { TeamFormDialog } from "@/app/(main)/teams/components/TeamDialogs"
import { createClient } from "@/shared/api/supabase/client"
import { Database } from "@/shared/types/database.types"
import { DataTable } from "@/shared/ui/data/DataTable"
import { Button, TextInput } from "@/shared/ui"
import { RiAddLine, RiGroupLine } from "@/shared/ui/lucide-icons"
import { canManageByRole } from "@/shared/lib/roles"
import { useMemo, useState } from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface TeamsPageProps {
  initialData: Profile[]
  page: number
  pageSize: number
  totalCount: number
  role?: string
}

export function TeamsPage({
  initialData,
  page,
  pageSize,
  totalCount,
  role,
}: TeamsPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Profile | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const canManage = canManageByRole(role)

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", (newPage + 1).toString()) // Convert 0-index to 1-index
    router.push(`${pathname}?${params.toString()}`)
  }

  const pageCount = Math.ceil(totalCount / pageSize)
  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredData = useMemo(() => {
    if (!normalizedSearch) return initialData
    return initialData.filter((profile) => {
      const haystack = [
        profile.full_name,
        profile.email,
        profile.job_title,
        profile.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(normalizedSearch)
    })
  }, [initialData, normalizedSearch])

  const totalMembers = initialData.length
  const totalDesigners = initialData.filter(
    (profile) => profile.job_title === "Designer",
  ).length
  const totalDevelopers = initialData.filter(
    (profile) => profile.job_title === "Web Developer",
  ).length
  const totalPMs = initialData.filter(
    (profile) => profile.job_title === "Project Manager",
  ).length
  const totalAdmins = initialData.filter(
    (profile) =>
      profile.role === "stakeholder" || profile.job_title === "Admin",
  ).length

  return (
    <>
      <div className="flex flex-col">
        <div className="flex items-center gap-2 rounded-[14px] px-5 pt-4 pb-3">
          <RiGroupLine className="size-4 text-foreground-secondary" />
          <p className="text-label-md text-foreground-primary">
            Team Members
          </p>
        </div>

        <div className="bg-surface-neutral-primary flex flex-col rounded-[14px]">
          <section className="grid grid-cols-1 gap-3 px-5 py-2 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Total Team", value: totalMembers },
              { label: "Designers", value: totalDesigners },
              { label: "Developers", value: totalDevelopers },
              { label: "Project Managers", value: totalPMs },
              { label: "Admin/Stakeholder", value: totalAdmins },
            ].map((item) => (
              <div
                key={item.label}
                className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-[10px] border px-4 py-3"
              >
                <p className="text-label-sm text-foreground-secondary">
                  {item.label}
                </p>
                <p className="text-heading-md text-foreground-primary">
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          <div className="flex items-center justify-between gap-3 border-b border-neutral-primary bg-surface-neutral-primary px-5 py-3">
            <TextInput
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              inputSize="lg"
              className="w-[260px]"
            />

            {canManage && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingItem(null)
                  setIsAddOpen(true)
                }}
              >
                <RiAddLine className="mr-2 size-4" />
                Add Member
              </Button>
            )}
          </div>

          <div className="p-5">
            <DataTable
              data={filteredData}
              columns={createTeamColumns({ canSelect: canManage })}
              manualPagination={true}
              pageCount={pageCount}
              pageIndex={page - 1} // Convert 1-index to 0-index
              onPageChange={handlePageChange}
              showFilterbar={false}
              enableSelection={canManage}
              onCreate={undefined}
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
              showTableWrapper={false}
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
    </>
  )
}
