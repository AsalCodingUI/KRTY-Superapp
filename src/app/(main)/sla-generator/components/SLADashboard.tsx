"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog"
import { SLAList } from "./SLAList"
import { activeSLAColumns, archivedSLAColumns, type SLA } from "./SLAColumns"
import { createClient } from "@/shared/api/supabase/client"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import {
  useViewMode,
  ViewToggle,
  type ViewMode,
} from "@/components/view-toggle"
import { SegmentedControl } from "@/components/segmented-control"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RiAddLine, RiSearchLine } from "@/shared/ui/lucide-icons"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import { useMountedTabs } from "@/shared/hooks/useMountedTabs"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import { useDateLocale, useT } from "@/shared/i18n/client"

// Removing dependency on Database definitions which are missing
// type SLA = Database["public"]["Tables"]["slas"]["Row"] & { archived_at: string | null };

export default function SLADashboard({
  slas,
  hideTitle = false,
  embedded = false,
  view: viewProp = "table",
}: {
  slas: SLA[]
  hideTitle?: boolean
  embedded?: boolean
  /** Embedded in Projects, the page's list/table switch decides. */
  view?: ViewMode
}) {
  const t = useT("sla")
  const dateLocale = useDateLocale()
  const router = useRouter()
  const supabase = createClient()
  const { activeTab: routeTab, setActiveTab: setRouteTab } = useTabRoute<
    "active" | "archive"
  >({
    basePath: "/sla-generator",
    tabs: ["active", "archive"],
    defaultTab: "active",
    mode: "history",
  })
  const [embeddedTab, setEmbeddedTab] = useState<"active" | "archive">("active")
  const [searchTerm, setSearchTerm] = useState("")
  // Standalone page: the viewer's own list/table choice. Embedded: the host's.
  const [savedView, setView] = useViewMode("sla-generator", "table")
  const view = embedded ? viewProp : savedView
  const activeTab = embedded ? embeddedTab : routeTab
  const setActiveTab = embedded ? setEmbeddedTab : setRouteTab
  const { isMounted } = useMountedTabs(activeTab)
  const [slaToArchive, setSlaToArchive] = useState<string | null>(null)
  const [slaToDelete, setSlaToDelete] = useState<string | null>(null)
  const { profile } = useUserProfile()

  const canManage = canManageByRole(profile?.role)

  // Filter data based on tab
  const activeSLAs = slas.filter((sla) => !sla.archived_at)
  const archivedSLAs = slas.filter((sla) => sla.archived_at)
  const searchValue = searchTerm.trim().toLowerCase()
  const filterBySearch = (rows: SLA[]) => {
    if (searchValue === "") return rows
    return rows.filter((row) => {
      const client = row.client_name?.toLowerCase?.() || ""
      const project = row.title?.toLowerCase?.() || ""
      return client.includes(searchValue) || project.includes(searchValue)
    })
  }
  const filteredActiveSLAs = filterBySearch(activeSLAs)
  const filteredArchivedSLAs = filterBySearch(archivedSLAs)

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("sla-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "slas" },
        () => router.refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router])

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/sla-generator?mode=edit&id=${id}`)
    },
    [router],
  )

  const handleView = useCallback(
    (id: string) => {
      router.push(`/sla-generator?mode=edit&id=${id}`)
    },
    [router],
  )

  // Archive handler (soft delete)
  const handleArchive = async (ids: unknown[]) => {
    const { error } = await supabase
      .from("slas")
      .update({ archived_at: new Date().toISOString() })
      .in("id", ids as string[])

    if (error) {
      toast.error(t("toastArchiveFailed"))
    } else {
      toast.success(t("toastArchived"))
      router.refresh()
    }
  }

  // Restore handler
  const handleRestore = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("slas")
        .update({ archived_at: null })
        .eq("id", id)

      if (error) {
        toast.error(t("toastRestoreFailed"))
      } else {
        toast.success(t("toastRestored"))
        router.refresh()
      }
    },
    [supabase, router, t],
  )

  const activeColumns = useMemo(
    () =>
      activeSLAColumns(handleEdit, (id) => setSlaToArchive(id), handleView, {
        canManage,
        t,
        dateLocale,
      }),
    [handleEdit, handleView, canManage, t, dateLocale],
  )
  const archivedColumns = useMemo(
    () =>
      archivedSLAColumns(handleRestore, (id) => setSlaToDelete(id), {
        canManage,
        t,
        dateLocale,
      }),
    [handleRestore, canManage, t, dateLocale],
  )

  // Permanent delete handler
  const handlePermanentDelete = async (ids: unknown[]) => {
    const { error } = await supabase
      .from("slas")
      .delete()
      .in("id", ids as string[])

    if (error) {
      toast.error(t("toastDeleteFailed"))
    } else {
      toast.success(t("toastDeleted"))
      router.refresh()
    }
  }

  const confirmArchive = async () => {
    if (slaToArchive) {
      await handleArchive([slaToArchive])
      setSlaToArchive(null)
    }
  }

  const confirmDelete = async () => {
    if (slaToDelete) {
      await handlePermanentDelete([slaToDelete])
      setSlaToDelete(null)
    }
  }

  const createButton = canManage && activeTab === "active" && (
    <Button onClick={() => router.push("/sla-generator?mode=create")}>
      <RiAddLine data-icon="inline-start" aria-hidden="true" />
      {t("newSla")}
    </Button>
  )
  const searchInput = (
    <InputGroup className="w-full sm:w-[250px]">
      <InputGroupAddon>
        <RiSearchLine aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        placeholder={t("searchPlaceholder")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </InputGroup>
  )

  const renderTab = (tab: "active" | "archive") => {
    const archived = tab === "archive"
    const rows = archived ? filteredArchivedSLAs : filteredActiveSLAs
    if (view === "list") {
      return (
        <SLAList
          slas={rows}
          archived={archived}
          canManage={canManage}
          onOpen={handleView}
          onArchive={(id) => setSlaToArchive(id)}
          onRestore={handleRestore}
          onDelete={(id) => setSlaToDelete(id)}
        />
      )
    }
    return (
      <DataTable
        data={rows}
        columns={archived ? archivedColumns : activeColumns}
        showExport={false}
        showViewOptions={false}
        showFilterbar={false}
        onDelete={
          canManage
            ? archived
              ? handlePermanentDelete
              : handleArchive
            : undefined
        }
        enableSelection={canManage}
        showTableWrapper={false}
      />
    )
  }

  return (
    <>
      {embedded ? (
        <div className={hideTitle ? "mb-4" : "mt-4"}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <SegmentedControl
                fitContent
                value={activeTab}
                onChange={(value) =>
                  setActiveTab(value as "active" | "archive")
                }
                items={[
                  { value: "active", label: t("tabActive") },
                  { value: "archive", label: t("tabArchive") },
                ]}
              />
              {searchInput}
            </div>
            {createButton}
          </div>
        </div>
      ) : (
        <>
          {/* Title + actions, bordered tabs, then the toolbar. */}
          <PageHeader
            className="pt-6 pb-4"
            title={t("pageTitle")}
            actions={
              <>
                <ViewToggle value={view} onValueChange={setView} />
                {createButton}
              </>
            }
          />
          <div className="bleed gutter-x border-border border-b">
            <div className="pb-3 xl:hidden">
              <Select
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as "active" | "archive")
                }
              >
                <SelectTrigger id="sla-tab-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("tabActive")}</SelectItem>
                  <SelectItem value="archive">{t("tabArchive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="hidden xl:block">
              <TabNavigation className="border-b-0">
                <TabNavigationLink
                  active={activeTab === "active"}
                  onClick={() => setActiveTab("active")}
                  showLeadingIcon={false}
                >
                  {t("tabActive")}
                </TabNavigationLink>
                <TabNavigationLink
                  active={activeTab === "archive"}
                  onClick={() => setActiveTab("archive")}
                  showLeadingIcon={false}
                >
                  {t("tabArchive")}
                </TabNavigationLink>
              </TabNavigation>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 pt-4 pb-3">
            {searchInput}
          </div>
        </>
      )}

      <div className="pb-4">
        {isMounted("active") && (
          <div className={activeTab === "active" ? "block" : "hidden"}>
            {renderTab("active")}
          </div>
        )}
        {isMounted("archive") && (
          <div className={activeTab === "archive" ? "block" : "hidden"}>
            {renderTab("archive")}
          </div>
        )}
      </div>

      {/* Archive Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!slaToArchive}
        onClose={() => setSlaToArchive(null)}
        onConfirm={confirmArchive}
        title={t("archiveDialogTitle")}
        description={t("archiveDialogDescription")}
        confirmText={t("archiveConfirm")}
      />

      {/* Permanent Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!slaToDelete}
        onClose={() => setSlaToDelete(null)}
        onConfirm={confirmDelete}
        title={t("deleteDialogTitle")}
        description={t("deleteDialogDescription")}
        confirmText={t("deleteConfirm")}
      />
    </>
  )
}
