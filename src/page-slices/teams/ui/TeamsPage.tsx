"use client"

import { RollingValue } from "@/components/rolling-value"
import { PageHeader } from "@/components/page-header"
import { createTeamColumns } from "@/app/(main)/teams/Columns"
import Link from "next/link"
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

  const teamColumns = useMemo(() => createTeamColumns({ canSelect: false }), [])

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

  const stats = [
    { label: "Total anggota", value: totalMembers },
    { label: "Designer", value: totalDesigners },
    { label: "Developer", value: totalDevelopers },
    { label: "Project Manager", value: totalPMs },
    { label: "Admin/Stakeholder", value: totalAdmins },
  ]

  return (
    <div className="flex flex-col">
      {/* Title + actions, a stats band, the search row, then the list. */}
      <PageHeader
        className="pt-6 pb-4"
        title="Team"
        actions={
          // The directory is read-only; members are managed on their own page.
          isSuperAdmin && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/teams/access" prefetch={false} />}
            >
              <RiLockLine data-icon="inline-start" />
              Anggota & Akses
            </Button>
          )
        }
      />

      <div className="stat-strip bleed gutter-x border-border border-b py-4">
        {stats.map((item) => (
          <div key={item.label} className="stat-tile">
            <p className="text-muted-foreground text-sm">{item.label}</p>
            <p className="text-foreground text-xl font-normal tracking-tight tabular-nums">
              <RollingValue>{item.value}</RollingValue>
            </p>
          </div>
        ))}
      </div>

      <div className="pt-4 pb-3">
        <InputGroup className="w-full sm:w-[260px]">
          <InputGroupAddon>
            <RiSearchLine />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Cari anggota..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </InputGroup>
      </div>

      <div className="pb-4">
        {/* One view only: the table. */}
        <DataTable
          data={filteredData}
          columns={teamColumns}
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
  )
}
