"use client"

import { PageHeader } from "@/components/page-header"
import { StatStrip } from "@/components/stat-strip"
import { createTeamColumns } from "@/app/(main)/teams/Columns"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { Database } from "@/shared/types/database.types"
import { DataTable } from "@/components/data-table"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { RiSearchLine } from "@/shared/ui/lucide-icons"
import { ContextTarget, copyText, type CtxItem } from "@/shared/context-menu"
import { employeeHref } from "@/shared/lib/url-params"
import { BarChart3, Copy, Mail } from "@/components/icons"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { MembersAccessSettings } from "@/page-slices/settings/ui"

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
  const t = useT("teams")
  const tm = useT("ctxmenu")
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

  const teamColumns = useMemo(
    () => createTeamColumns({ canSelect: false, t }),
    [t],
  )

  const copy = async (text: string) => {
    if (await copyText(text)) toast.success(tm("copied"))
    else toast.error(tm("copyFailed"))
  }
  /** Right-click on a directory row: reach the person, see their KPI. */
  const memberItems = (p: Profile): CtxItem[] =>
    [
      {
        id: "kpi",
        label: t("ctxViewKpi"),
        icon: BarChart3,
        onSelect: () => router.push(employeeHref(p)),
      },
      {
        id: "copy-name",
        label: tm("copyName"),
        icon: Copy,
        hidden: !p.full_name,
        onSelect: () => copy(p.full_name ?? ""),
      },
      {
        id: "copy-email",
        label: tm("copyEmail"),
        icon: Copy,
        hidden: !p.email,
        onSelect: () => copy(p.email ?? ""),
      },
      {
        id: "send-email",
        label: tm("sendEmail"),
        icon: Mail,
        hidden: !p.email,
        onSelect: () => {
          window.location.href = `mailto:${p.email}`
        },
      },
    ].filter((item) => !item.hidden)

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
    { label: t("statTotal"), value: totalMembers },
    { label: t("statDesigner"), value: totalDesigners },
    { label: t("statDeveloper"), value: totalDevelopers },
    { label: t("statProjectManager"), value: totalPMs },
    { label: t("statAdmin"), value: totalAdmins },
  ]

  // Super admins manage everyone from the same table (sheet: profile and
  // access); everyone else gets the read-only directory.
  if (isSuperAdmin) {
    return (
      <div className="flex flex-col">
        <MembersAccessSettings title={t("title")} showStats />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Title + actions, a stats band, the search row, then the list. */}
      <PageHeader title={t("title")} />

      <StatStrip
        items={stats.map((item) => ({ key: String(item.label), ...item }))}
      />

      <div className="pt-4 pb-3">
        <InputGroup className="w-full sm:w-[260px]">
          <InputGroupAddon>
            <RiSearchLine />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </InputGroup>
      </div>

      <div>
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
          wrapRow={(p, row) => (
            <ContextTarget
              type="member"
              id={p.id}
              label={p.full_name || p.email || undefined}
              items={() => memberItems(p)}
            >
              {row}
            </ContextTarget>
          )}
        />
      </div>
    </div>
  )
}
