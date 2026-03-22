"use client"

import { QuarterBadge } from "@/app/(main)/performance/components/admin/QuarterBadge"
import {
  deleteCalculation,
  getCalculationsByProject,
} from "@/app/(main)/calculator/actions/calculation-actions"
import {
  deleteInvoice,
  getInvoicesByProject,
  getPaymentMethods,
} from "@/app/(main)/finance/actions/invoice-actions"
import type { InvoiceStatus } from "@/app/(main)/finance/actions/invoice-actions"
import { createClient } from "@/shared/api/supabase/client"
import { useMountedTabs } from "@/shared/hooks/useMountedTabs"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import type { Database } from "@/shared/types/database.types"
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  TabNavigation,
  TabNavigationLink,
} from "@/shared/ui"
import {
  RiAddLine,
  RiArrowLeftLine,
  RiDeleteBin6Line,
  RiEdit2Line,
  RiFileList3Line,
} from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  InvoiceFormDialog,
  INVOICE_STATUS_VARIANTS,
  type InvoiceRow,
  type PaymentMethodRow,
} from "./InvoiceFormDialog"

const formatCurrency = (n: number) =>
  n.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })

type ProjectStatus = Database["public"]["Enums"]["project_status_enum"]
type TabType = "overview" | "calculations" | "slas" | "finance"
type ProjectCalculation =
  Database["public"]["Tables"]["project_calculations"]["Row"]
type SLARow = Database["public"]["Tables"]["slas"]["Row"]

type ProjectAssignment = {
  id: string
  role_in_project: string
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

type ProjectDetail = {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  status: ProjectStatus
  quarter_id: string | null
  project_assignments: ProjectAssignment[] | null
}

const getStatusVariant = (
  status: ProjectStatus,
): "success" | "info" | "zinc" => {
  const variants: Record<ProjectStatus, "success" | "info" | "zinc"> = {
    Active: "success",
    Completed: "info",
    Archived: "zinc",
  }
  return variants[status]
}

function ProjectOverviewContent({ project }: { project: ProjectDetail }) {
  const teamMembers =
    project.project_assignments?.map((assignment) => ({
      id: assignment.id,
      role: assignment.role_in_project,
      name: assignment.profiles?.full_name || "Unknown",
      image: assignment.profiles?.avatar_url || undefined,
    })) || []

  return (
    <Card className="space-y-5">
      <div className="space-y-2">
        <p className="text-label-sm text-foreground-secondary">Project name</p>
        <p className="text-body-md text-foreground-primary font-medium">
          {project.name}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-label-sm text-foreground-secondary">Description</p>
        <p className="text-body-sm text-foreground-primary">
          {project.description || "No description"}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="text-label-sm text-foreground-secondary">Timeline</p>
          <p className="text-body-sm text-foreground-primary">
            {format(new Date(project.start_date), "MMM d, yyyy")} -{" "}
            {format(new Date(project.end_date), "MMM d, yyyy")}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-label-sm text-foreground-secondary">Status</p>
          <Badge variant={getStatusVariant(project.status)}>
            {project.status}
          </Badge>
        </div>
        <div className="space-y-2">
          <p className="text-label-sm text-foreground-secondary">Quarter</p>
          {project.quarter_id ? (
            <QuarterBadge quarter={project.quarter_id} />
          ) : (
            <span className="text-foreground-disable text-body-sm">
              No quarter
            </span>
          )}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-label-sm text-foreground-secondary">Team members</p>
        {teamMembers.length > 0 ? (
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar
                  src={member.image}
                  alt={member.name}
                  size="sm"
                  initials={member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                />
                <div className="min-w-0">
                  <p className="text-body-sm text-foreground-primary truncate font-medium">
                    {member.name}
                  </p>
                  <p className="text-label-xs text-foreground-secondary">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-foreground-secondary">
            No team members assigned.
          </p>
        )}
      </div>
    </Card>
  )
}

function CalculationsTabContent({ projectId }: { projectId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const { data: calculationsResult, isLoading } = useQuery({
    queryKey: ["calculations", projectId],
    queryFn: () => getCalculationsByProject(projectId),
  })

  const calculations: ProjectCalculation[] = calculationsResult?.success
    ? calculationsResult.data
    : []

  const handleDeleteCalculation = async () => {
    if (!pendingDeleteId) return
    const result = await deleteCalculation(pendingDeleteId)
    if (result.success) {
      toast.success("Calculation deleted")
      queryClient.invalidateQueries({ queryKey: ["calculations", projectId] })
    } else {
      toast.error("Failed to delete calculation")
    }
    setPendingDeleteId(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    )
  }

  return (
    <>
      {calculations.length === 0 ? (
        <EmptyState
          icon={<RiFileList3Line className="size-5" />}
          title="No calculations yet"
          description="Saved project calculations will appear here."
        />
      ) : (
        <div className="space-y-3">
          {calculations.map((calculation) => (
            <Card
              key={calculation.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-body-sm text-foreground-primary truncate font-medium">
                  {calculation.title}
                </p>
                <p className="text-label-xs text-foreground-secondary">
                  {format(new Date(calculation.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="tertiary"
                  size="icon-sm"
                  title="Edit Calculation"
                  onClick={() =>
                    router.push(
                      `/projects/${projectId}/calculator/${calculation.id}`,
                    )
                  }
                >
                  <RiEdit2Line className="size-3.5" />
                </Button>
                <Button
                  variant="tertiary"
                  size="icon-sm"
                  title="Delete Calculation"
                  onClick={() => setPendingDeleteId(calculation.id)}
                  className="text-foreground-danger-dark hover:bg-surface-danger-light"
                >
                  <RiDeleteBin6Line className="size-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null)
        }}
        onConfirm={handleDeleteCalculation}
        title="Delete Calculation?"
        description="This calculation will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  )
}

function SLAsTabContent({ projectId }: { projectId: string }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const { data: slas, isLoading } = useQuery({
    queryKey: ["project-slas", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slas")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data || []) as SLARow[]
    },
  })

  const handleDeleteSLA = async () => {
    if (!pendingDeleteId) return
    const { error } = await supabase
      .from("slas")
      .delete()
      .eq("id", pendingDeleteId)
    if (error) {
      toast.error("Failed to delete SLA")
    } else {
      toast.success("SLA deleted")
      queryClient.invalidateQueries({ queryKey: ["project-slas", projectId] })
    }
    setPendingDeleteId(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    )
  }

  return (
    <>
      {slas == null || slas.length === 0 ? (
        <EmptyState
          icon={<RiFileList3Line className="size-5" />}
          title="No SLAs yet"
          description="Project-specific SLA documents will appear here."
        />
      ) : (
        <div className="space-y-3">
          {slas.map((sla) => (
            <Card
              key={sla.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-body-sm text-foreground-primary truncate font-medium">
                  {sla.client_name}
                </p>
                <p className="text-label-xs text-foreground-secondary truncate">
                  {sla.project_name}
                </p>
                <p className="text-label-xs text-foreground-secondary">
                  {format(new Date(sla.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="tertiary"
                  size="icon-sm"
                  title="Edit SLA"
                  onClick={() =>
                    router.push(`/projects/${projectId}/sla/${sla.id}`)
                  }
                >
                  <RiEdit2Line className="size-3.5" />
                </Button>
                <Button
                  variant="tertiary"
                  size="icon-sm"
                  title="Delete SLA"
                  onClick={() => setPendingDeleteId(sla.id)}
                  className="text-foreground-danger-dark hover:bg-surface-danger-light"
                >
                  <RiDeleteBin6Line className="size-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null)
        }}
        onConfirm={handleDeleteSLA}
        title="Delete SLA?"
        description="This SLA will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  )
}

function FinanceTabContent({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient()
  const [subTab, setSubTab] = useState<"invoice" | "quotation">("invoice")
  const [formOpen, setFormOpen] = useState(false)
  const [editInvoice, setEditInvoice] = useState<InvoiceRow | undefined>(
    undefined,
  )
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const { data: invoicesResult, isLoading } = useQuery({
    queryKey: ["invoices", projectId],
    queryFn: () => getInvoicesByProject(projectId),
  })

  const { data: pmResult } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => getPaymentMethods(),
  })

  const invoices: InvoiceRow[] = invoicesResult?.success
    ? invoicesResult.data
    : []
  const paymentMethods: PaymentMethodRow[] = pmResult?.success
    ? pmResult.data
    : []

  const handleDeleteInvoice = async () => {
    if (!pendingDeleteId) return
    const result = await deleteInvoice(pendingDeleteId)
    if (result.success) {
      toast.success("Invoice deleted")
      queryClient.invalidateQueries({ queryKey: ["invoices", projectId] })
    } else {
      toast.error("Failed to delete invoice")
    }
    setPendingDeleteId(null)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            size="sm"
            fitContent
            value={subTab}
            onChange={(value) => setSubTab(value as "invoice" | "quotation")}
            items={[
              { value: "invoice", label: "Invoices" },
              { value: "quotation", label: "Quotation" },
            ]}
          />

          {subTab === "invoice" && (
            <Button
              size="sm"
              onClick={() => {
                setEditInvoice(undefined)
                setFormOpen(true)
              }}
            >
              <RiAddLine className="mr-2 size-4" /> New Invoice
            </Button>
          )}
        </div>

        {subTab === "invoice" && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : invoices.length === 0 ? (
              <EmptyState
                icon={<RiFileList3Line className="size-5" />}
                title="No invoices yet"
                description="Create your first invoice to start tracking project payments."
                action={{
                  label: "New Invoice",
                  onClick: () => {
                    setEditInvoice(undefined)
                    setFormOpen(true)
                  },
                }}
              />
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <Card
                    key={inv.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm text-foreground-primary truncate font-medium">
                        {inv.invoice_number}
                      </p>
                      <p className="text-label-xs text-foreground-secondary">
                        {format(new Date(inv.issue_date), "MMM d, yyyy")} →{" "}
                        {format(new Date(inv.due_date), "MMM d, yyyy")}
                      </p>
                      <p className="text-label-xs text-foreground-secondary">
                        {formatCurrency(inv.amount_idr)} (paid:{" "}
                        {formatCurrency(inv.amount_paid_idr)})
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        variant={
                          INVOICE_STATUS_VARIANTS[
                            inv.status as InvoiceStatus
                          ] || "zinc"
                        }
                      >
                        {inv.status}
                      </Badge>
                      <Button
                        variant="tertiary"
                        size="icon-sm"
                        title="Edit Invoice"
                        onClick={() => {
                          setEditInvoice(inv)
                          setFormOpen(true)
                        }}
                      >
                        <RiEdit2Line className="size-3.5" />
                      </Button>
                      <Button
                        variant="tertiary"
                        size="icon-sm"
                        title="Delete Invoice"
                        onClick={() => setPendingDeleteId(inv.id)}
                        className="text-foreground-danger-dark hover:bg-surface-danger-light"
                      >
                        <RiDeleteBin6Line className="size-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {subTab === "quotation" && (
          <Card>
            <EmptyState
              icon={<RiFileList3Line className="size-5" />}
              title="Quotation is coming soon"
              description="Quotation management is planned for a future update."
              placement="inner"
            />
            <div className="flex justify-center pb-6">
              <Badge variant="zinc">Planned</Badge>
            </div>
          </Card>
        )}
      </div>

      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        projectId={projectId}
        invoice={editInvoice}
        paymentMethods={paymentMethods}
        onSuccess={() =>
          queryClient.invalidateQueries({
            queryKey: ["invoices", projectId],
          })
        }
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null)
        }}
        onConfirm={handleDeleteInvoice}
        title="Delete Invoice?"
        description="This invoice will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  )
}

const OverviewTab = dynamic(() => Promise.resolve(ProjectOverviewContent), {
  loading: () => null,
})

const CalculationsTab = dynamic(() => Promise.resolve(CalculationsTabContent), {
  loading: () => null,
})

const SLAsTab = dynamic(() => Promise.resolve(SLAsTabContent), {
  loading: () => null,
})

const FinanceTab = dynamic(() => Promise.resolve(FinanceTabContent), {
  loading: () => null,
})

export function ProjectDetailPage({ project }: { project: ProjectDetail }) {
  const router = useRouter()
  const { activeTab, setActiveTab } = useTabRoute<TabType>({
    basePath: `/projects/${project.id}`,
    tabs: ["overview", "calculations", "slas", "finance"],
    defaultTab: "overview",
    mode: "history",
  })
  const { isMounted } = useMountedTabs(activeTab)

  return (
    <div className="flex flex-col">
      <div className="rounded-xxl flex items-center gap-2 px-5 pt-4 pb-3">
        <Button variant="secondary" size="sm" onClick={() => router.push("/projects")}>
          <RiArrowLeftLine className="mr-2 size-4" />
          Back to Projects
        </Button>
      </div>

      <div className="bg-surface-neutral-primary rounded-xxl flex flex-col">
        <div className="px-5 pt-5">
          <div className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-heading-md text-foreground-primary">
                {project.name}
              </h1>
              <Badge variant={getStatusVariant(project.status)}>
                {project.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="border-neutral-primary border-b px-5 pt-2">
          <div className="pb-2 xl:hidden">
            <Select
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabType)}
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="calculations">Calculations</SelectItem>
                <SelectItem value="slas">SLAs</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="hidden xl:block">
            <TabNavigation value={activeTab} className="border-b-0">
              <TabNavigationLink
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </TabNavigationLink>
              <TabNavigationLink
                active={activeTab === "calculations"}
                onClick={() => setActiveTab("calculations")}
              >
                Calculations
              </TabNavigationLink>
              <TabNavigationLink
                active={activeTab === "slas"}
                onClick={() => setActiveTab("slas")}
              >
                SLAs
              </TabNavigationLink>
              <TabNavigationLink
                active={activeTab === "finance"}
                onClick={() => setActiveTab("finance")}
              >
                Finance
              </TabNavigationLink>
            </TabNavigation>
          </div>
        </div>

        <div className="p-5">
          {isMounted("overview") && (
            <div
              className={
                activeTab === "overview"
                  ? "block space-y-5"
                  : "hidden space-y-5"
              }
            >
              <OverviewTab project={project} />
            </div>
          )}
          {isMounted("calculations") && (
            <div
              className={
                activeTab === "calculations"
                  ? "block space-y-5"
                  : "hidden space-y-5"
              }
            >
              <CalculationsTab projectId={project.id} />
            </div>
          )}
          {isMounted("slas") && (
            <div
              className={
                activeTab === "slas" ? "block space-y-5" : "hidden space-y-5"
              }
            >
              <SLAsTab projectId={project.id} />
            </div>
          )}
          {isMounted("finance") && (
            <div
              className={
                activeTab === "finance" ? "block space-y-5" : "hidden space-y-5"
              }
            >
              <FinanceTab projectId={project.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
