"use client"

import { createClient } from "@/shared/api/supabase/client"
import { Database } from "@/shared/types/database.types"
import {
  Avatar, AvatarGroup, AvatarOverflow, Badge, Button, Card, ConfirmDialog, DateRangePicker, EmptyState, Label, QuarterFilter, QuarterFilterValue, Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow, TableSection, Tooltip
} from "@/shared/ui"
import {
  RiCheckDoubleLine,
  RiErrorWarningLine,
  RiEyeLine,
  RiRocketLine,
  RiStopCircleLine,
  RiTimeLine,
  RiUserLine,
} from "@/shared/ui/lucide-icons"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { toast } from "sonner"
import useSWR from "swr"
import { AdminViewResultModal } from "./AdminViewResultModal"

type PerformanceSummary =
  Database["public"]["Tables"]["performance_summaries"]["Row"]

// --- TIPE DATA ---
type ReviewStatus = {
  userId: string
  name: string
  jobTitle: string
  reviewedBy: { name: string }[]
  pendingBy: { name: string }[]
  percentage: number
  cycleIdUsed: string | null
  summaryData: PerformanceSummary | null
  debugInfo?: string
}

type ReviewCycle = {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

export function AdminReviewDashboard() {
  const supabase = createClient()

  // State Data & UI
  const [selectedQuarter, setSelectedQuarter] =
    useState<QuarterFilterValue>("2025-Q1")

  // Derive year and quarter from selection
  const currentYear =
    parseInt(selectedQuarter.split("-")[0]) || new Date().getFullYear()
  const quarterOnly = selectedQuarter.split("-")[1] || "Q1"

  const [cycleDate, setCycleDate] = useState<DateRange | undefined>()
  const [cycleName, setCycleName] = useState<string>(
    `${currentYear} -${quarterOnly} `,
  )
  const [activeCycleData, setActiveCycleData] = useState<ReviewCycle | null>(
    null,
  )

  // State Penting: Menyimpan UUID asli dari database untuk Quarter ini
  const [quarterUUID, setQuarterUUID] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [statsData, setStatsData] = useState<ReviewStatus[]>([])

  // State Modal View Result
  const [selectedEmployee, setSelectedEmployee] = useState<ReviewStatus | null>(
    null,
  )
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  // State Confirm Dialogs
  const [isEndCycleConfirmOpen, setIsEndCycleConfirmOpen] = useState(false)
  const [isTriggerN8NConfirmOpen, setIsTriggerN8NConfirmOpen] = useState(false)
  const [selectedEmployeeForN8N, setSelectedEmployeeForN8N] =
    useState<ReviewStatus | null>(null)

  // 0. SYNC: Konek Quarter Filter ke Cycle Name
  useEffect(() => {
    const targetName = `${currentYear}-${quarterOnly}` // Format: "2025-Q1" (no spaces)
    setCycleName(targetName)
  }, [selectedQuarter, currentYear, quarterOnly])

  const { data: dashboardData, isLoading: isFetching, mutate } = useSWR(
    ["admin-review-dashboard", selectedQuarter],
    async () => {
      // A. Cek Siklus Aktif (Global)
      const { data: cycle } = await supabase
        .from("review_cycles")
        .select("*")
        .eq("is_active", true)
        .single()

      const activeCycle = cycle || null
      const activeCycleDate = cycle
        ? {
          from: new Date(cycle.start_date),
          to: new Date(cycle.end_date),
        }
        : undefined

      // B. Ambil Data Karyawan
      const { data: employees } = await supabase
        .from("profiles")
        .select("id, full_name, job_title")
        .neq("role", "stakeholder")

      if (!employees) {
        return {
          activeCycleData: activeCycle,
          cycleDate: activeCycleDate,
          quarterUUID: null,
          statsData: [] as ReviewStatus[],
        }
      }

      // C. Filter Logic (Mencari Cycle ID yang Valid untuk Quarter ini)
      const targetCycleName = `${currentYear}-${quarterOnly}` // Format: "2025-Q1"

      // Cari cycle yang NAMANYA sesuai dengan quarter yang dipilih
      const { data: cyclesByName } = await supabase
        .from("review_cycles")
        .select("id, name")
        .eq("name", targetCycleName) // Exact match, bukan ilike

      // Gabungkan hasil pencarian UUID
      const validCycleIds = (cyclesByName || []).map((c: { id: string }) => c.id)
      const quarterUUID = validCycleIds.length > 0 ? validCycleIds[0] : null

      const legacyCycleId = targetCycleName

      // D. Fetch REVIEWS
      const { data: reviews } = await supabase
        .from("performance_reviews")
        .select("reviewer_id, reviewee_id, cycle_id")

      const safeReviews = (reviews || []).filter((r: { cycle_id: string; reviewer_id: string; reviewee_id: string }) => {
        return (
          validCycleIds.includes(r.cycle_id) || r.cycle_id === legacyCycleId
        )
      })

      // E. Fetch SUMMARIES
      const { data: allSummaries } = await supabase
        .from("performance_summaries")
        .select("*")

      // F. Calculate Stats
      const stats = employees.map((targetEmp: { id: string; full_name: string | null; job_title: string | null }) => {
        const reviewsReceived = safeReviews.filter(
          (r: { reviewee_id: string; cycle_id: string; reviewer_id: string }) => r.reviewee_id === targetEmp.id,
        )
        const reviewerIds = reviewsReceived.map((r: { reviewer_id: string }) => r.reviewer_id)
        const userActiveCycleId =
          reviewsReceived.length > 0 ? reviewsReceived[0].cycle_id : null

        const reviewedBy = employees
          .filter((e: { id: string }) => reviewerIds.includes(e.id))
          .map((e: { full_name: string | null }) => ({ name: e.full_name || "Unknown" }))

        const pendingBy = employees
          .filter((e: { id: string }) => e.id !== targetEmp.id && !reviewerIds.includes(e.id))
          .map((e: { full_name: string | null }) => ({ name: e.full_name || "Unknown" }))

        const totalPeers = employees.length - 1
        const percentage =
          totalPeers > 0
            ? Math.round((reviewedBy.length / totalPeers) * 100)
            : 0

        let existingSummary = null
        let debugMatchInfo = "No Match"

        if (userActiveCycleId) {
          existingSummary = allSummaries?.find(
            (s: { reviewee_id: string; cycle_id: string }) =>
              s.reviewee_id === targetEmp.id &&
              s.cycle_id === userActiveCycleId,
          )
          if (existingSummary) debugMatchInfo = `Exact`
        }
        if (!existingSummary) {
          existingSummary = allSummaries?.find(
            (s: { reviewee_id: string; cycle_id: string }) =>
              s.reviewee_id === targetEmp.id &&
              (validCycleIds.includes(s.cycle_id) ||
                s.cycle_id === legacyCycleId),
          )
          if (existingSummary) debugMatchInfo = `Cross / Orphan`
        }

        return {
          userId: targetEmp.id,
          name: targetEmp.full_name || "Unknown",
          jobTitle: targetEmp.job_title || "-",
          reviewedBy,
          pendingBy,
          percentage,
          cycleIdUsed: userActiveCycleId,
          summaryData: existingSummary || null,
          debugInfo: debugMatchInfo,
        }
      })

      return {
        activeCycleData: activeCycle,
        cycleDate: activeCycleDate,
        quarterUUID,
        statsData: stats,
      }
    },
    { revalidateOnFocus: false },
  )

  const isDataLoading = isFetching && statsData.length === 0

  useEffect(() => {
    if (!dashboardData) return
    setActiveCycleData(dashboardData.activeCycleData)
    setCycleDate(dashboardData.cycleDate)
    setQuarterUUID(dashboardData.quarterUUID)
    setStatsData(dashboardData.statsData)
  }, [dashboardData])

  // --- HANDLERS ---
  const handleSaveCycle = async () => {
    if (!cycleDate?.from || !cycleDate?.to) return toast.error("Pilih tanggal")
    if (cycleName !== `${currentYear}-${quarterOnly}`) {
      return toast.warning("Nama cycle tidak sesuai")
    }

    setLoading(true)
    if (activeCycleData) {
      await supabase
        .from("review_cycles")
        .update({
          name: cycleName,
          start_date: cycleDate.from.toISOString(),
          end_date: cycleDate.to.toISOString(),
        })
        .eq("id", activeCycleData.id)
      toast.success("Jadwal diperbarui")
    } else {
      await supabase
        .from("review_cycles")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("review_cycles").insert({
        name: cycleName,
        start_date: cycleDate.from.toISOString(),
        end_date: cycleDate.to.toISOString(),
        is_active: true,
      })
      toast.success("Siklus dimulai")
      await mutate()
    }
    setLoading(false)
  }

  const handleEndCycle = async () => {
    if (!activeCycleData) return
    setIsEndCycleConfirmOpen(true)
  }

  const confirmEndCycle = async () => {
    if (!activeCycleData) return
    setLoading(true)
    await supabase
      .from("review_cycles")
      .update({ is_active: false })
      .eq("id", activeCycleData.id)
    toast.info("Siklus ditutup")
    await mutate()
    setLoading(false)
  }

  // HANDLER SINGLE PROCESS - LOGIC REVISI
  const handleTriggerN8N = async (employee: ReviewStatus) => {
    setSelectedEmployeeForN8N(employee)
    setIsTriggerN8NConfirmOpen(true)
  }

  const confirmTriggerN8N = async () => {
    if (!selectedEmployeeForN8N) return

    // --- LOGIC PRIORITAS BARU ---
    // 1. Utamakan UUID Asli dari Database (quarterUUID)
    //    Kenapa? Karena n8n butuh UUID. Meskipun user punya review lama pake ID "2025-Q1",
    //    kita harus paksa kirim UUID baru biar summary-nya tersimpan dengan benar.
    let idToSend = quarterUUID

    // 2. Jika UUID tidak ketemu (jarang terjadi kalau sudah start cycle),
    //    baru fallback ke ID Active Cycle atau ID User.
    if (!idToSend) {
      idToSend = activeCycleData?.id || selectedEmployeeForN8N.cycleIdUsed
    }

    // 3. Last resort: Legacy Text (Hanya kalau benar2 tidak ada data)
    if (!idToSend) {
      idToSend = `${currentYear}-${quarterOnly}`
    }

    try {
      await fetch("/api/trigger-n8n", {
        method: "POST",
        body: JSON.stringify({
          reviewee_id: selectedEmployeeForN8N.userId,
          cycle_id: idToSend,
        }),
      })
      toast.success("Permintaan terkirim")
    } catch (e) {
      console.error(e)
      toast.error("Gagal memproses")
    }
    await mutate()
  }

  const handleViewResult = (employeeData: ReviewStatus) => {
    setSelectedEmployee(employeeData)
    setIsViewModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* 1. MAIN FILTER */}
      <div className="flex flex-col items-end justify-between gap-4 sm:flex-row sm:items-center">
        <QuarterFilter value={selectedQuarter} onChange={setSelectedQuarter} />
      </div>

      {/* 2. MANAGEMENT CARD */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-foreground-primary font-semibold">
            Review Cycle Management
          </h3>
          {activeCycleData ? (
            <Badge variant="success" className="animate-pulse">
              Active: {activeCycleData.name}
            </Badge>
          ) : (
            <Badge variant="zinc">No Active Cycle</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
          {/* Hidden but functional - Target Cycle Name */}
          <input type="hidden" value={cycleName} />

          <div>
            <Label>Active Period</Label>
            <DateRangePicker
              className="mt-2 w-full"
              value={cycleDate}
              onChange={setCycleDate}
            />
          </div>
          <div className="flex gap-2">
            {activeCycleData ? (
              <>
                <Button
                  onClick={handleSaveCycle}
                  isLoading={loading}
                  variant="secondary"
                >
                  Update
                </Button>
                <Button
                  onClick={handleEndCycle}
                  isLoading={loading}
                  variant="destructive"
                  title="Stop Cycle"
                >
                  <RiStopCircleLine className="mr-1 size-5" /> End
                </Button>
              </>
            ) : (
              <Button
                onClick={handleSaveCycle}
                isLoading={loading}
                className="w-full"
              >
                Start Cycle ({cycleName})
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 3. MONITORING TABLE */}
      <TableSection title={`Monitoring Progress — ${selectedQuarter}`}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Employee</TableHeaderCell>
              <TableHeaderCell>Reviewed By</TableHeaderCell>
              <TableHeaderCell>Pending Reviewers</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isDataLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-body-sm text-foreground-secondary">
                  Loading reviews...
                </TableCell>
              </TableRow>
            ) : (
              <>
                {statsData.map((item) => (
                  <TableRow key={item.userId}>
                    <TableCell>
                      <span
                        className="text-foreground-primary font-medium"
                        title={
                          item.jobTitle && item.jobTitle !== "-"
                            ? `${item.name} — ${item.jobTitle}`
                            : item.name
                        }
                      >
                        {item.name}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.reviewedBy.length > 0 ? (
                          <AvatarGroup>
                            {item.reviewedBy.slice(0, 5).map((reviewer, idx) => (
                              <Tooltip key={idx} content={reviewer.name}>
                                <Avatar
                                  size="sm"
                                  initials={reviewer.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .substring(0, 2)}
                                />
                              </Tooltip>
                            ))}
                            {item.reviewedBy.length > 5 && (
                              <Tooltip
                                content={`+ ${item.reviewedBy.length - 5} more`}
                              >
                                <AvatarOverflow
                                  count={item.reviewedBy.length - 5}
                                  size="sm"
                                />
                              </Tooltip>
                            )}
                          </AvatarGroup>
                        ) : (
                          <span className="text-foreground-disable">None</span>
                        )}
                        <span className="text-foreground-secondary">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.pendingBy.length > 0 ? (
                          <AvatarGroup>
                            {item.pendingBy.slice(0, 5).map((pending, idx) => (
                              <Tooltip key={idx} content={pending.name}>
                                <Avatar
                                  size="sm"
                                  initials={pending.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .substring(0, 2)}
                                />
                              </Tooltip>
                            ))}
                            {item.pendingBy.length > 5 && (
                              <Tooltip
                                content={`+ ${item.pendingBy.length - 5} more`}
                              >
                                <AvatarOverflow
                                  count={item.pendingBy.length - 5}
                                  size="sm"
                                />
                              </Tooltip>
                            )}
                          </AvatarGroup>
                        ) : (
                          <span className="text-body-xs text-foreground-disable">
                            None
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.summaryData ? (
                          <Badge variant="success" className="gap-1 pr-2 pl-1">
                            <RiCheckDoubleLine className="size-3.5" /> Published
                          </Badge>
                        ) : item.percentage > 0 ? (
                          <Badge variant="warning" className="gap-1 pr-2 pl-1">
                            <RiTimeLine className="size-3.5" /> Collecting
                          </Badge>
                        ) : (
                          <Badge variant="zinc" className="gap-1 pr-2 pl-1">
                            <RiErrorWarningLine className="size-3.5" /> Not Started
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      {item.summaryData ? (
                        <Button
                          size="sm"
                          variant="tertiary"
                          leadingIcon={<RiEyeLine className="size-3.5" />}
                          onClick={() => handleViewResult(item)}
                        >
                          View Result
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="tertiary"
                          leadingIcon={<RiRocketLine className="size-3.5" />}
                          onClick={() => handleTriggerN8N(item)}
                          disabled={item.percentage === 0}
                          title="Process Individual"
                        >
                          Process
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {statsData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState
                        icon={<RiUserLine />}
                        title="No employees found"
                        description="Employees will appear here once assigned to this quarter"
                      />
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </TableSection>

      {/* MODAL VIEW RESULT */}
      <AdminViewResultModal
        isOpen={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        employee={selectedEmployee}
        selectedQuarter={selectedQuarter}
        currentYear={currentYear}
      />

      {/* CONFIRM DIALOGS */}
      <ConfirmDialog
        open={isEndCycleConfirmOpen}
        onOpenChange={setIsEndCycleConfirmOpen}
        onConfirm={confirmEndCycle}
        title="End Review Cycle"
        description="Are you sure you want to end this review cycle? This action will deactivate the current cycle."
        confirmText="End Cycle"
        variant="destructive"
        loading={loading}
      />

      <ConfirmDialog
        open={isTriggerN8NConfirmOpen}
        onOpenChange={setIsTriggerN8NConfirmOpen}
        onConfirm={confirmTriggerN8N}
        title="Process Performance Data"
        description={`Send ${selectedEmployeeForN8N?.name}'s performance data to AI for processing?`}
        confirmText="Process"
      />
    </div>
  )
}
