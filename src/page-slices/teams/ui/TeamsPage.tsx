"use client"

import { createTeamColumns } from "@/app/(main)/teams/Columns"
import { useSettingsModal } from "@/shared/hooks/useSettingsModal"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { Database } from "@/shared/types/database.types"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { RiLockLine, RiSearchLine } from "@/shared/ui/lucide-icons"
import { useMemo, useState } from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface TeamsPageProps {
  initialData: Profile[]
  page: number
  pageSize: number
  totalCount: number
  /** Kept for the route's props; the page is read-only for everyone. */
  role?: string
}

export function TeamsPage({
  initialData,
  page,
  pageSize,
  totalCount,
}: TeamsPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState("")

  const { profile } = useUserProfile()
  const isSuperAdmin = profile?.is_super_admin === true
  const settings = useSettingsModal()

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
        <div className="flex flex-col">
          <section className="my-2 grid grid-cols-1 gap-x-8 gap-y-4 py-2 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Total Team", value: totalMembers },
              { label: "Designers", value: totalDesigners },
              { label: "Developers", value: totalDevelopers },
              { label: "Project Managers", value: totalPMs },
              { label: "Admin/Stakeholder", value: totalAdmins },
            ].map((item) => (
              <div key={item.label} className="flex min-w-0 flex-col gap-1">
                <p className="text-muted-foreground text-sm">{item.label}</p>
                <p className="text-foreground text-lg font-medium tabular-nums">
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <InputGroup className="w-full sm:w-[260px]">
              <InputGroupAddon>
                <RiSearchLine />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </InputGroup>

            <div className="flex items-center gap-2">
              {/* The directory is read-only; members are managed in Settings. */}
              {isSuperAdmin && (
                <Button
                  variant="outline"
                  onClick={() => settings.open("members")}
                >
                  <RiLockLine data-icon="inline-start" />
                  Anggota & Akses
                </Button>
              )}
            </div>
          </div>

          <div className="py-4">
            <DataTable
              data={filteredData}
              columns={createTeamColumns({ canSelect: false })}
              manualPagination={true}
              pageCount={pageCount}
              pageIndex={page - 1} // Convert 1-index to 0-index
              onPageChange={handlePageChange}
              showFilterbar={false}
              enableSelection={false}
              showTableWrapper={false}
            />
          </div>
        </div>
      </div>
    </>
  )
}
