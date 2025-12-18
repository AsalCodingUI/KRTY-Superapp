"use client"

import { Avatar, AvatarGroup, AvatarOverflow } from "@/components/Avatar"
import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { DateRangePicker } from "@/components/DatePicker"
import { Label } from "@/components/Label"
import { QuarterFilter, QuarterFilterValue } from "@/components/QuarterFilter"
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/Table"
import { TableSection } from "@/components/TableSection"
import { Tooltip } from "@/components/Tooltip"
import { Database } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/client"
import {
    RiCheckDoubleLine,
    RiErrorWarningLine,
    RiEyeLine,
    RiRocketLine,
    RiStopCircleLine,
    RiTimeLine
} from "@remixicon/react"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { toast } from "sonner"
import { AdminViewResultModal } from "./AdminViewResultModal"

type PerformanceSummary = Database["public"]["Tables"]["performance_summaries"]["Row"]

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


export function AdminReviewDashboard({ activeCycleId }: { activeCycleId: string | null }) {
    const supabase = createClient()

    // State Data & UI
    const [selectedQuarter, setSelectedQuarter] = useState<QuarterFilterValue>("2025-Q1")

    // Derive year and quarter from selection
    const currentYear = parseInt(selectedQuarter.split("-")[0]) || new Date().getFullYear()
    const quarterOnly = selectedQuarter.split("-")[1] || "Q1"

    const [cycleDate, setCycleDate] = useState<DateRange | undefined>()
    const [cycleName, setCycleName] = useState<string>(`${currentYear} -${quarterOnly} `)
    const [activeCycleData, setActiveCycleData] = useState<ReviewCycle | null>(null)

    // State Penting: Menyimpan UUID asli dari database untuk Quarter ini
    const [quarterUUID, setQuarterUUID] = useState<string | null>(null)

    const [loading, setLoading] = useState(false)
    const [statsData, setStatsData] = useState<ReviewStatus[]>([])

    // State Modal View Result
    const [selectedEmployee, setSelectedEmployee] = useState<ReviewStatus | null>(null)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)

    // 0. SYNC: Konek Quarter Filter ke Cycle Name
    useEffect(() => {
        const targetName = `${currentYear}-${quarterOnly}` // Format: "2025-Q1" (no spaces)
        setCycleName(targetName)
    }, [selectedQuarter, currentYear, quarterOnly])

    // 1. FETCH DATA
    useEffect(() => {
        const initData = async () => {
            setLoading(true)

            // A. Cek Siklus Aktif (Global)
            const { data: cycle } = await supabase
                .from('review_cycles')
                .select('*')
                .eq('is_active', true)
                .single()

            if (cycle) {
                setActiveCycleData(cycle)
                setCycleDate({
                    from: new Date(cycle.start_date),
                    to: new Date(cycle.end_date)
                })
            }

            // B. Ambil Data Karyawan
            const { data: employees } = await supabase
                .from('profiles')
                .select('id, full_name, job_title')
                .neq('role', 'stakeholder')

            if (!employees) {
                setLoading(false)
                return
            }

            // C. Filter Logic (Mencari Cycle ID yang Valid untuk Quarter ini)
            const targetCycleName = `${currentYear}-${quarterOnly}` // Format: "2025-Q1"

            // Cari cycle yang NAMANYA sesuai dengan quarter yang dipilih
            const { data: cyclesByName } = await supabase
                .from('review_cycles')
                .select('id, name')
                .eq('name', targetCycleName)  // Exact match, bukan ilike

            // Gabungkan hasil pencarian UUID
            const validCycleIds = (cyclesByName || []).map(c => c.id)

            // SIMPAN UUID YANG DITEMUKAN KE STATE
            if (validCycleIds.length > 0) {
                setQuarterUUID(validCycleIds[0])
            } else {
                setQuarterUUID(null)
            }

            const legacyCycleId = targetCycleName

            // D. Fetch REVIEWS
            const { data: reviews } = await supabase
                .from('performance_reviews')
                .select('reviewer_id, reviewee_id, cycle_id')

            const safeReviews = (reviews || []).filter(r => {
                return validCycleIds.includes(r.cycle_id) || r.cycle_id === legacyCycleId
            })

            // E. Fetch SUMMARIES
            const { data: allSummaries } = await supabase
                .from('performance_summaries')
                .select('*')

            // F. Calculate Stats
            const stats = employees.map(targetEmp => {
                const reviewsReceived = safeReviews.filter(r => r.reviewee_id === targetEmp.id)
                const reviewerIds = reviewsReceived.map(r => r.reviewer_id)
                const userActiveCycleId = reviewsReceived.length > 0 ? reviewsReceived[0].cycle_id : null;

                const reviewedBy = employees
                    .filter(e => reviewerIds.includes(e.id))
                    .map(e => ({ name: e.full_name || "Unknown" }))

                const pendingBy = employees
                    .filter(e => e.id !== targetEmp.id && !reviewerIds.includes(e.id))
                    .map(e => ({ name: e.full_name || "Unknown" }))

                const totalPeers = employees.length - 1
                const percentage = totalPeers > 0 ? Math.round((reviewedBy.length / totalPeers) * 100) : 0

                let existingSummary = null;
                let debugMatchInfo = "No Match";

                if (userActiveCycleId) {
                    existingSummary = allSummaries?.find(s => s.reviewee_id === targetEmp.id && s.cycle_id === userActiveCycleId)
                    if (existingSummary) debugMatchInfo = `Exact`
                }
                if (!existingSummary) {
                    existingSummary = allSummaries?.find(s =>
                        s.reviewee_id === targetEmp.id &&
                        (validCycleIds.includes(s.cycle_id) || s.cycle_id === legacyCycleId)
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
                    debugInfo: debugMatchInfo
                }
            })
            setStatsData(stats)
            setLoading(false)
        }

        initData()
    }, [supabase, activeCycleId, selectedQuarter, currentYear, quarterOnly])

    // --- HANDLERS ---
    const handleSaveCycle = async () => {
        if (!cycleDate?.from || !cycleDate?.to) return toast.error("Mohon pilih Tanggal.")
        if (cycleName !== `${currentYear}-${quarterOnly}`) {
            return toast.warning(`Nama Cycle harus ${currentYear}-${quarterOnly} agar sesuai data.`)
        }

        setLoading(true)
        if (activeCycleData) {
            await supabase.from('review_cycles').update({
                name: cycleName,
                start_date: cycleDate.from.toISOString(),
                end_date: cycleDate.to.toISOString()
            }).eq('id', activeCycleData.id)
            toast.success("Jadwal diperbarui!")
        } else {
            await supabase.from('review_cycles').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('review_cycles').insert({
                name: cycleName,
                start_date: cycleDate.from.toISOString(),
                end_date: cycleDate.to.toISOString(),
                is_active: true
            })
            toast.success(`Siklus Review ${cycleName} Dimulai!`)
            window.location.reload()
        }
        setLoading(false)
    }

    const handleEndCycle = async () => {
        if (!activeCycleData) return
        if (!confirm("Akhiri siklus ini?")) return
        setLoading(true)
        await supabase.from('review_cycles').update({ is_active: false }).eq('id', activeCycleData.id)
        toast.info("Siklus dinonaktifkan.")
        window.location.reload()
    }

    // HANDLER SINGLE PROCESS - LOGIC REVISI
    const handleTriggerN8N = async (employee: ReviewStatus) => {
        // --- LOGIC PRIORITAS BARU ---
        // 1. Utamakan UUID Asli dari Database (quarterUUID)
        //    Kenapa? Karena n8n butuh UUID. Meskipun user punya review lama pake ID "2025-Q1",
        //    kita harus paksa kirim UUID baru biar summary-nya tersimpan dengan benar.
        let idToSend = quarterUUID;

        // 2. Jika UUID tidak ketemu (jarang terjadi kalau sudah start cycle),
        //    baru fallback ke ID Active Cycle atau ID User.
        if (!idToSend) {
            idToSend = activeCycleData?.id || employee.cycleIdUsed;
        }

        // 3. Last resort: Legacy Text (Hanya kalau benar2 tidak ada data)
        if (!idToSend) {
            idToSend = `${currentYear}-${quarterOnly}`;
        }



        if (!confirm("Kirim data ke AI?")) return

        try {
            await fetch('/api/trigger-n8n', {
                method: 'POST',
                body: JSON.stringify({ reviewee_id: employee.userId, cycle_id: idToSend })
            })
            toast.success("Permintaan dikirim! Silakan refresh dalam 10-20 detik.")
        } catch (e) {
            console.error(e)
            toast.error("Gagal memproses.")
        }
    }


    const handleViewResult = (employeeData: ReviewStatus) => {
        setSelectedEmployee(employeeData)
        setIsViewModalOpen(true)
    }

    return (
        <div className="space-y-6">

            {/* 1. MAIN FILTER */}
            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
                <QuarterFilter
                    value={selectedQuarter}
                    onChange={setSelectedQuarter}
                />
            </div>

            {/* 2. MANAGEMENT CARD */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-content dark:text-content">Review Cycle Management</h3>
                    {activeCycleData ? (
                        <Badge variant="success" className="animate-pulse">Active: {activeCycleData.name}</Badge>
                    ) : (
                        <Badge variant="zinc">No Active Cycle</Badge>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    {/* Hidden but functional - Target Cycle Name */}
                    <input type="hidden" value={cycleName} />

                    <div>
                        <Label>Active Period</Label>
                        <DateRangePicker className="mt-2 w-full" value={cycleDate} onChange={setCycleDate} />
                    </div>
                    <div className="flex gap-2">
                        {activeCycleData ? (
                            <>
                                <Button onClick={handleSaveCycle} isLoading={loading} variant="secondary">Update</Button>
                                <Button onClick={handleEndCycle} isLoading={loading} variant="destructive" title="Stop Cycle"><RiStopCircleLine className="size-5 mr-1" /> End</Button>
                            </>
                        ) : (
                            <Button onClick={handleSaveCycle} isLoading={loading} className="w-full">Start Cycle ({cycleName})</Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* 3. MONITORING TABLE */}
            <TableSection
                title={`Monitoring Progress — ${selectedQuarter}`}
            >
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
                        {statsData.map((item) => (
                            <TableRow key={item.userId}>
                                <TableCell>
                                    <div>
                                        <p className="font-medium text-content dark:text-content">{item.name}</p>
                                        <p className="text-content-subtle dark:text-content-placeholder">{item.jobTitle}</p>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {item.reviewedBy.length > 0 ? (
                                            <AvatarGroup>
                                                {item.reviewedBy.slice(0, 5).map((reviewer, idx) => (
                                                    <Tooltip key={idx} content={reviewer.name}>
                                                        <Avatar
                                                            size="sm"
                                                            initials={reviewer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                        />
                                                    </Tooltip>
                                                ))}
                                                {item.reviewedBy.length > 5 && (
                                                    <Tooltip content={`+ ${item.reviewedBy.length - 5} more`}>
                                                        <AvatarOverflow count={item.reviewedBy.length - 5} size="sm" />
                                                    </Tooltip>
                                                )}
                                            </AvatarGroup>
                                        ) : (
                                            <span className="text-content-placeholder">None</span>
                                        )}
                                        <span className="text-content-subtle">({item.percentage}%)</span>
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
                                                            initials={pending.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                        />
                                                    </Tooltip>
                                                ))}
                                                {item.pendingBy.length > 5 && (
                                                    <Tooltip content={`+ ${item.pendingBy.length - 5} more`}>
                                                        <AvatarOverflow count={item.pendingBy.length - 5} size="sm" />
                                                    </Tooltip>
                                                )}
                                            </AvatarGroup>
                                        ) : (
                                            <span className="text-xs text-content-placeholder">None</span>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {item.summaryData ? (
                                            <Badge variant="success" className="gap-1 pl-1 pr-2">
                                                <RiCheckDoubleLine className="size-3.5" /> Published
                                            </Badge>
                                        ) : item.percentage > 0 ? (
                                            <Badge variant="warning" className="gap-1 pl-1 pr-2">
                                                <RiTimeLine className="size-3.5" /> Collecting
                                            </Badge>
                                        ) : (
                                            <Badge variant="zinc" className="gap-1 pl-1 pr-2">
                                                <RiErrorWarningLine className="size-3.5" /> Not Started
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell className="text-right">
                                    {item.summaryData ? (
                                        <Button size="xs" variant="secondary" onClick={() => handleViewResult(item)}>
                                            <RiEyeLine className="size-4 mr-1" /> View Result
                                        </Button>
                                    ) : (
                                        <Button
                                            size="xs"
                                            variant="secondary"
                                            onClick={() => handleTriggerN8N(item)}
                                            disabled={item.percentage === 0}
                                            title="Process Individual"
                                        >
                                            <RiRocketLine className="size-4 mr-1" /> Process
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {statsData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-content-subtle">
                                    No employees found.
                                </TableCell>
                            </TableRow>
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
        </div>
    )
}