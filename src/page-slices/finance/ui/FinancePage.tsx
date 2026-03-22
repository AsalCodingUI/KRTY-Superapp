"use client"

import type { InvoiceStatus } from "@/app/(main)/finance/actions/invoice-actions"
import {
  getAllInvoices,
  getPaymentMethods,
} from "@/app/(main)/finance/actions/invoice-actions"
import {
  INVOICE_STATUS_VARIANTS,
  InvoiceFormDialog,
  type PaymentMethodRow,
} from "@/page-slices/projects/ui/InvoiceFormDialog"
import { createClient } from "@/shared/api/supabase/client"
import { useMountedTabs } from "@/shared/hooks/useMountedTabs"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import type { Database } from "@/shared/types/database.types"
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  TabNavigation,
  TabNavigationLink,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSection,
} from "@/shared/ui"
import { RiAddLine, RiFileList3Line, RiMoneyDollarCircleLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

type TabType = "invoices" | "payroll"
type InvoiceRow = Database["public"]["Tables"]["project_invoices"]["Row"]

const formatCurrency = (n: number) =>
  n.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })

function SelectProjectDialog({
  open,
  onOpenChange,
  projects,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: { id: string; name: string }[]
  onSelect: (projectId: string) => void
}) {
  const [selected, setSelected] = useState("")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Select Project</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a project..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              onSelect(selected)
              onOpenChange(false)
              setSelected("")
            }}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InvoicesTabContent({
  invoices,
  paymentMethods,
  projects,
}: {
  invoices: InvoiceRow[]
  paymentMethods: PaymentMethodRow[]
  projects: { id: string; name: string }[]
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectProjectOpen, setSelectProjectOpen] = useState(false)
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  )

  return (
    <div className="space-y-5">
      <TableSection
        title="All Invoices"
        actions={
          <Button size="sm" onClick={() => setSelectProjectOpen(true)}>
            <RiAddLine className="mr-2 size-4" /> New Invoice
          </Button>
        }
      >
        {invoices.length === 0 ? (
          <EmptyState
            icon={<RiFileList3Line className="size-5" />}
            title="No invoices found"
            description="Create your first invoice to start tracking payments."
            placement="inner"
            action={{
              label: "New Invoice",
              onClick: () => setSelectProjectOpen(true),
            }}
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow className="h-[40px] hover:bg-transparent">
                <TableHeaderCell>Invoice No</TableHeaderCell>
                <TableHeaderCell>Project</TableHeaderCell>
                <TableHeaderCell>Issue Date</TableHeaderCell>
                <TableHeaderCell>Due Date</TableHeaderCell>
                <TableHeaderCell>Amount</TableHeaderCell>
                <TableHeaderCell>Paid</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => {
                const project = (inv as any).projects as {
                  id: string
                  name: string
                } | null
                return (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => {
                      if (project) {
                        router.push(`/projects/${project.id}?tab=finance`)
                      }
                    }}
                  >
                    <TableCell>
                      <span className="text-foreground-primary font-medium">
                        {inv.invoice_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground-primary">
                        {project?.name || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(inv.issue_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(inv.due_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{formatCurrency(inv.amount_idr)}</TableCell>
                    <TableCell>{formatCurrency(inv.amount_paid_idr)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          INVOICE_STATUS_VARIANTS[
                          inv.status as InvoiceStatus
                          ] || "zinc"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </TableSection>

      <SelectProjectDialog
        open={selectProjectOpen}
        onOpenChange={setSelectProjectOpen}
        projects={projects}
        onSelect={(projectId) => {
          setSelectedProjectId(projectId)
          setInvoiceFormOpen(true)
        }}
      />

      {selectedProjectId && (
        <InvoiceFormDialog
          open={invoiceFormOpen}
          onOpenChange={setInvoiceFormOpen}
          projectId={selectedProjectId}
          paymentMethods={paymentMethods}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["invoices", "all"] })
            queryClient.invalidateQueries({
              queryKey: ["invoices", selectedProjectId],
            })
          }}
        />
      )}
    </div>
  )
}

function PayrollTabContent() {
  return (
    <EmptyState
      icon={<RiMoneyDollarCircleLine className="size-5" />}
      title="Payroll"
      description="Payroll management is coming soon."
      subtitle="This feature is currently under development."
      placement="inner"
    />
  )
}

const InvoicesTab = dynamic(() => Promise.resolve(InvoicesTabContent), {
  loading: () => null,
})

const PayrollTab = dynamic(() => Promise.resolve(PayrollTabContent), {
  loading: () => null,
})

export function FinancePage() {
  const { activeTab, setActiveTab } = useTabRoute<TabType>({
    basePath: "/finance",
    tabs: ["invoices", "payroll"],
    defaultTab: "invoices",
    mode: "history",
  })
  const { isMounted } = useMountedTabs(activeTab)
  const supabase = useMemo(() => createClient(), [])

  const { data: invoicesResult, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: () => getAllInvoices(),
  })

  const { data: projectsData } = useQuery({
    queryKey: ["finance", "projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .neq("status", "Archived")
        .order("name", { ascending: true })
      return data || []
    },
  })

  const { data: pmResult } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => getPaymentMethods(),
  })

  const invoices: InvoiceRow[] = invoicesResult?.success
    ? invoicesResult.data
    : []
  const projects = projectsData || []
  const paymentMethods: PaymentMethodRow[] = pmResult?.success
    ? pmResult.data
    : []

  const totalBilled = invoices.reduce(
    (sum, inv) => sum + (inv.amount_idr ?? 0),
    0,
  )
  const totalPaid = invoices.reduce(
    (sum, inv) => sum + (inv.amount_paid_idr ?? 0),
    0,
  )
  const outstanding = totalBilled - totalPaid
  const overdueCount = invoices.filter((inv) => inv.status === "Overdue").length

  return (
    <div className="flex flex-col">
      <div className="rounded-xxl flex items-center gap-2 px-5 pt-4 pb-3">
        <RiMoneyDollarCircleLine className="text-foreground-secondary size-4" />
        <p className="text-label-md text-foreground-primary">Finance</p>
      </div>

      <div className="bg-surface-neutral-primary rounded-xxl flex flex-col">
        <div className="px-5 py-2">
          {isInvoicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : (
            <div className="grid gap-lg sm:grid-cols-2 xl:grid-cols-5">
              {[
                { label: "Total Invoices", value: String(invoices.length) },
                { label: "Total Billed", value: formatCurrency(totalBilled) },
                { label: "Total Paid", value: formatCurrency(totalPaid) },
                { label: "Outstanding", value: formatCurrency(outstanding) },
                { label: "Overdue", value: String(overdueCount) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3"
                >
                  <dt className="text-label-sm text-foreground-secondary">
                    {stat.label}
                  </dt>
                  <dd className="text-heading-md text-foreground-primary">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </div>
          )}
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
                <SelectItem value="invoices">Invoices</SelectItem>
                <SelectItem value="payroll">Payroll</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="hidden xl:block">
            <TabNavigation value={activeTab} className="border-b-0">
              <TabNavigationLink
                active={activeTab === "invoices"}
                onClick={() => setActiveTab("invoices")}
              >
                Invoices
              </TabNavigationLink>
              <TabNavigationLink
                active={activeTab === "payroll"}
                onClick={() => setActiveTab("payroll")}
              >
                Payroll
              </TabNavigationLink>
            </TabNavigation>
          </div>
        </div>

        <div className="p-5">
          {isMounted("invoices") && (
            <div
              className={
                activeTab === "invoices"
                  ? "block space-y-5"
                  : "hidden space-y-5"
              }
            >
              {isInvoicesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="md" />
                </div>
              ) : (
                <InvoicesTab
                  invoices={invoices}
                  paymentMethods={paymentMethods}
                  projects={projects}
                />
              )}
            </div>
          )}
          {isMounted("payroll") && (
            <div
              className={
                activeTab === "payroll" ? "block space-y-5" : "hidden space-y-5"
              }
            >
              <PayrollTab />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
