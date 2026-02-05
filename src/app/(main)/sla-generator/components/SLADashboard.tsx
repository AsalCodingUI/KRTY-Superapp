"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog"
import { activeSLAColumns, archivedSLAColumns, type SLA } from "./SLAColumns"
import { TabNavigation, TabNavigationLink } from "@/components/ui"
import { createClient } from "@/shared/api/supabase/client"
import { DataTable } from "@/shared/ui"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"

// Removing dependency on Database definitions which are missing
// type SLA = Database["public"]["Tables"]["slas"]["Row"] & { archived_at: string | null };

export default function SLADashboard({ slas }: { slas: SLA[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<"active" | "archive">("active")
  const [slaToArchive, setSlaToArchive] = useState<string | null>(null)
  const [slaToDelete, setSlaToDelete] = useState<string | null>(null)
  const { profile } = useUserProfile()

  const canManage = canManageByRole(profile?.role)

  // Filter data based on tab
  const activeSLAs = slas.filter((sla) => !sla.archived_at)
  const archivedSLAs = slas.filter((sla) => sla.archived_at)
  const displayData = activeTab === "active" ? activeSLAs : archivedSLAs

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

  const handleEdit = (id: string) => {
    router.push(`/sla-generator?mode=edit&id=${id}`)
  }

  const handleView = (id: string) => {
    router.push(`/sla-generator?mode=edit&id=${id}`)
  }

  // Archive handler (soft delete)
  const handleArchive = async (ids: unknown[]) => {
    const { error } = await supabase
      .from("slas")
      .update({ archived_at: new Date().toISOString() })
      .in("id", ids as string[])

    if (error) {
      toast.error("Failed to archive SLA")
    } else {
      toast.success("SLA archived successfully")
      router.refresh()
    }
  }

  // Restore handler
  const handleRestore = async (id: string) => {
    const { error } = await supabase
      .from("slas")
      .update({ archived_at: null })
      .eq("id", id)

    if (error) {
      toast.error("Failed to restore SLA")
    } else {
      toast.success("SLA restored successfully")
      router.refresh()
    }
  }

  // Permanent delete handler
  const handlePermanentDelete = async (ids: unknown[]) => {
    const { error } = await supabase
      .from("slas")
      .delete()
      .in("id", ids as string[])

    if (error) {
      toast.error("Failed to delete SLA")
    } else {
      toast.success("SLA permanently deleted")
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

  return (
    <>
      <h1 className="text-heading-md text-content sm:text-heading-lg dark:text-content">
        SLA Generator
      </h1>

      {/* Tabs */}
      <TabNavigation className="mt-4">
        <TabNavigationLink
          active={activeTab === "active"}
          onClick={() => setActiveTab("active")}
        >
          Active
        </TabNavigationLink>
        <TabNavigationLink
          active={activeTab === "archive"}
          onClick={() => setActiveTab("archive")}
        >
          Archive
        </TabNavigationLink>
      </TabNavigation>

      <div className="mt-6">
        {activeTab === "active" ? (
          <DataTable
            data={displayData}
            columns={activeSLAColumns(
              handleEdit,
              (id) => setSlaToArchive(id),
              handleView,
              { canManage },
            )}
            showExport={false}
            showViewOptions={false}
            showFilterbar={true}
            onCreate={
              canManage
                ? () => router.push("/sla-generator?mode=create")
                : undefined
            }
            actionLabel="Create New SLA"
            onDelete={canManage ? handleArchive : undefined}
            enableSelection={canManage}
            showTableWrapper={false}
            tableTitle="Active SLAs"
            tableDescription="Manage your active Service Level Agreements"
            searchKey="client_name"
          />
        ) : (
          <DataTable
            data={displayData}
            columns={archivedSLAColumns(
              handleRestore,
              (id) => setSlaToDelete(id),
              { canManage },
            )}
            showExport={false}
            showViewOptions={false}
            showFilterbar={true}
            onCreate={undefined}
            onDelete={canManage ? handlePermanentDelete : undefined}
            enableSelection={canManage}
            showTableWrapper={false}
            tableTitle="Archived SLAs"
            tableDescription="Restore or permanently delete archived SLAs"
            searchKey="client_name"
          />
        )}
      </div>

      {/* Archive Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!slaToArchive}
        onClose={() => setSlaToArchive(null)}
        onConfirm={confirmArchive}
        title="Archive SLA"
        description="This SLA will be moved to Archive. You can restore it later from the Archive tab."
        confirmText="Archive"
      />

      {/* Permanent Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!slaToDelete}
        onClose={() => setSlaToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete SLA Permanently"
        description="⚠️ This action cannot be undone. The SLA will be permanently deleted from the database."
        confirmText="Delete Permanently"
      />
    </>
  )
}
