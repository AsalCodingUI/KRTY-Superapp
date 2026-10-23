"use client"
import {
  deleteCalculation,
  getCalculationsByProject,
  saveCalculation,
  updateCalculation,
} from "@/entities/calculator/api/client"
import { createClient } from "@/shared/api/supabase/client"
import type { Database } from "@/shared/types/database.types"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  RiAddLine,
  RiCalculatorLine,
  RiDeleteBinLine,
} from "@/shared/ui/lucide-icons"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { FinancialHUD } from "./components/FinancialHUD"
import { FreelanceSection } from "./components/FreelanceSection"
import { OperationalCostsSection } from "./components/OperationalCostsSection"
import { ProjectContextSection } from "./components/ProjectContextSection"
import { SquadSection } from "./components/SquadSection"
import { TimelineSection } from "./components/TimelineSection"
import type {
  FreelanceMember,
  OperationalCost,
  Phase,
  SquadMember,
  TeamMember,
} from "./types"
import { formatNumber } from "./utils"

type ProjectCalculation =
  Database["public"]["Tables"]["project_calculations"]["Row"]

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const parseNumber = (val: string): number => {
  const num = parseFloat(val.replace(/,/g, ""))
  return isNaN(num) ? 0 : num
}

const DEFAULT_PHASES: Phase[] = [
  { id: "1", name: "Discovery & Design", days: 5, buffer: 1 },
  { id: "2", name: "Development", days: 10, buffer: 2 },
]

export default function CalculatorClientPage({
  teamMembers,
  operationalCosts,
  projects,
  prefilledProjectId,
  hideProjectSelector = false,
  initialCalculation,
  showHeader = true,
}: {
  teamMembers: TeamMember[]
  operationalCosts: OperationalCost[]
  projects: { id: string; name: string }[]
  prefilledProjectId?: string
  hideProjectSelector?: boolean
  initialCalculation?: ProjectCalculation | null
  showHeader?: boolean
}) {
  const t = useT("calculator")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const WORK_DAYS_PER_MONTH = 22
  const BILLABLE_UTILIZATION = 0.7
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()

  const [revenueUSD, setRevenueUSD] = useState<string>(
    initialCalculation
      ? formatNumber(String(initialCalculation.revenue_usd))
      : "1,000",
  )
  const [exchangeRate, setExchangeRate] = useState<string>(
    initialCalculation
      ? formatNumber(String(initialCalculation.exchange_rate))
      : "15,000",
  )
  const [hoursPerDay, setHoursPerDay] = useState<string>(
    initialCalculation ? String(initialCalculation.hours_per_day) : "8",
  )
  const [targetMarginPercent, setTargetMarginPercent] = useState<string>(
    initialCalculation ? String(initialCalculation.target_margin) : "40",
  )

  const [phases, setPhases] = useState<Phase[]>(
    initialCalculation
      ? (initialCalculation.phases as unknown as Phase[]) || DEFAULT_PHASES
      : DEFAULT_PHASES,
  )

  const [squad, setSquad] = useState<SquadMember[]>(
    initialCalculation
      ? (initialCalculation.squad as unknown as SquadMember[]) || []
      : [],
  )
  const [freelanceSquad, setFreelanceSquad] = useState<FreelanceMember[]>(
    initialCalculation
      ? (initialCalculation.freelance_squad as unknown as FreelanceMember[]) ||
          []
      : [],
  )
  const [costItems, setCostItems] = useState<OperationalCost[]>(
    operationalCosts || [],
  )
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState<string>("")
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    prefilledProjectId || "",
  )
  const [currentCalculationId, setCurrentCalculationId] = useState<
    string | null
  >(initialCalculation?.id || null)
  const [calculationTitle, setCalculationTitle] = useState<string>(
    initialCalculation?.title || t("untitledCalculation"),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (prefilledProjectId) {
      setSelectedProjectId(prefilledProjectId)
    }
  }, [prefilledProjectId])

  useEffect(() => {
    if (!initialCalculation) return
    setRevenueUSD(formatNumber(String(initialCalculation.revenue_usd)))
    setExchangeRate(formatNumber(String(initialCalculation.exchange_rate)))
    setHoursPerDay(String(initialCalculation.hours_per_day))
    setTargetMarginPercent(String(initialCalculation.target_margin))
    setPhases(initialCalculation.phases as unknown as Phase[])
    setSquad(initialCalculation.squad as unknown as SquadMember[])
    setFreelanceSquad(
      initialCalculation.freelance_squad as unknown as FreelanceMember[],
    )
    setCurrentCalculationId(initialCalculation.id)
    setCalculationTitle(initialCalculation.title)
  }, [initialCalculation])

  const { data: calculationsResult } = useQuery({
    queryKey: ["calculations", selectedProjectId],
    queryFn: () => getCalculationsByProject(selectedProjectId),
    enabled: !!selectedProjectId,
  })

  const savedCalculations: ProjectCalculation[] = calculationsResult?.success
    ? calculationsResult.data
    : []

  const totalDuration = useMemo(() => {
    return phases.reduce((sum, p) => sum + p.days + p.buffer, 0)
  }, [phases])

  const totalProjectDays = useMemo(() => {
    return phases.reduce((sum, p) => sum + p.days, 0)
  }, [phases])

  const grossRevenue = useMemo(() => {
    return parseNumber(revenueUSD) * parseNumber(exchangeRate)
  }, [revenueUSD, exchangeRate])

  const totalProjectHours = useMemo(() => {
    const hours = parseNumber(hoursPerDay)
    if (hours <= 0) return 0
    return squad.reduce((total, member) => {
      const allocation = member.allocation / 100
      return total + totalProjectDays * hours * allocation
    }, 0)
  }, [hoursPerDay, squad, totalProjectDays])

  const totalLaborCost = useMemo(() => {
    return squad.reduce((total, member) => {
      const profile = teamMembers.find((p) => p.id === member.profileId)
      if (!profile) return total
      const monthlySalary =
        profile.monthly_salary != null
          ? profile.monthly_salary
          : profile.hourly_rate != null
            ? profile.hourly_rate * 8 * 22
            : 0
      const dailyRate = monthlySalary / WORK_DAYS_PER_MONTH
      const cost = dailyRate * totalProjectDays * (member.allocation / 100)
      return total + cost
    }, 0)
  }, [squad, teamMembers, totalProjectDays])

  const overheadTotal = useMemo(() => {
    return costItems
      .filter((item) => item.is_active !== false)
      .reduce((sum, item) => sum + (item.amount_idr || 0), 0)
  }, [costItems])

  const overheadPerHour = useMemo(() => {
    const activeMembers = squad.length || teamMembers.length || 1
    const totalBillableHours =
      activeMembers * WORK_DAYS_PER_MONTH * 8 * BILLABLE_UTILIZATION
    if (totalBillableHours <= 0) return 0
    return overheadTotal / totalBillableHours
  }, [BILLABLE_UTILIZATION, overheadTotal, squad, teamMembers])

  const overheadCost = overheadPerHour * totalProjectHours

  const freelanceCost = useMemo(() => {
    return freelanceSquad.reduce(
      (sum, member) => sum + parseNumber(member.totalFee),
      0,
    )
  }, [freelanceSquad])

  const totalCost = totalLaborCost + overheadCost + freelanceCost
  const netProfit = grossRevenue - totalCost
  const marginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0
  const targetMargin = parseNumber(targetMarginPercent)
  const suggestedPrice =
    targetMargin >= 100 ? 0 : totalCost / (1 - targetMargin / 100)

  const addPhase = () => {
    setPhases([
      ...phases,
      { id: createId(), name: t("newPhase"), days: 1, buffer: 0 },
    ])
  }

  const removePhase = (id: string) => {
    setPhases(phases.filter((p) => p.id !== id))
  }

  const updatePhase = (
    id: string,
    field: keyof Phase,
    value: string | number,
  ) => {
    setPhases(phases.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const addSquadMember = (profileId: string) => {
    if (!profileId) return
    if (squad.some((s) => s.profileId === profileId)) {
      toast.warning(t("toastMemberAlreadyAdded"))
      return
    }
    setSquad([...squad, { id: createId(), profileId, allocation: 100 }])
  }

  const removeSquadMember = (id: string) => {
    setSquad(squad.filter((s) => s.id !== id))
  }

  const updateAllocation = (id: string, value: number[]) => {
    setSquad(
      squad.map((s) => (s.id === id ? { ...s, allocation: value[0] } : s)),
    )
  }

  const addFreelanceMember = () => {
    setFreelanceSquad([
      ...freelanceSquad,
      { id: createId(), name: "", role: "", totalFee: "", notes: "" },
    ])
  }

  const removeFreelanceMember = (id: string) => {
    setFreelanceSquad(freelanceSquad.filter((s) => s.id !== id))
  }

  const updateFreelanceMember = (
    id: string,
    field: keyof FreelanceMember,
    value: string | number,
  ) => {
    setFreelanceSquad(
      freelanceSquad.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    )
  }

  const exportCostsAsCSV = () => {
    const header =
      "item_name,amount_idr,category,currency_original,amount_original,exchange_rate_assumed,is_active"
    const rows = costItems.map((item) =>
      [
        item.item_name ?? "",
        item.amount_idr ?? 0,
        item.category ?? "other",
        item.currency_original ?? "IDR",
        item.amount_original ?? 0,
        item.exchange_rate_assumed ?? 0,
        item.is_active !== false,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    )
    const csv = [header, ...rows].join("\n")
    downloadFile(csv, "operational_costs.csv", "text/csv")
  }

  const exportCostsAsJSON = () => {
    const payload = {
      operational_costs: costItems.map((item) => ({
        item_name: item.item_name ?? "",
        amount_idr: item.amount_idr ?? 0,
        category: item.category ?? "other",
        currency_original: item.currency_original ?? "IDR",
        amount_original: item.amount_original ?? 0,
        exchange_rate_assumed: item.exchange_rate_assumed ?? 0,
        is_active: item.is_active !== false,
      })),
    }
    downloadFile(
      JSON.stringify(payload, null, 2),
      "operational_costs.json",
      "application/json",
    )
  }

  const downloadTemplateCSV = () => {
    const template =
      "item_name,amount_idr,category,currency_original,amount_original,exchange_rate_assumed,is_active\n"
    downloadFile(template, "operational_costs_template.csv", "text/csv")
  }

  const downloadTemplateJSON = () => {
    const template = {
      operational_costs: [
        {
          item_name: "",
          amount_idr: 0,
          category: "tools",
          currency_original: "IDR",
          amount_original: 0,
          exchange_rate_assumed: 0,
          is_active: true,
        },
      ],
    }
    downloadFile(
      JSON.stringify(template, null, 2),
      "operational_costs_template.json",
      "application/json",
    )
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (text: string) => {
    const lines = text.trim().split(/\r?\n/)
    const header =
      lines
        .shift()
        ?.split(",")
        .map((h) => h.trim()) || []
    return lines.map((line) => {
      const values = line
        .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        .map((v) => v.replace(/^"|"$/g, "").replace(/""/g, '"'))
      const record: Record<string, string> = {}
      header.forEach((key, idx) => {
        record[key] = values[idx] ?? ""
      })
      return record
    })
  }

  const processImport = async (file: File) => {
    const text = await file.text()
    let items: Array<OperationalCost | any> = []
    if (file.name.endsWith(".json")) {
      const parsed = JSON.parse(text)
      items = Array.isArray(parsed) ? parsed : parsed.operational_costs || []
    } else {
      const rows = parseCSV(text)
      items = rows.map((row) => ({
        item_name: row.item_name,
        amount_idr: Number(row.amount_idr || 0),
        category: row.category || "other",
        currency_original: row.currency_original || "IDR",
        amount_original: Number(row.amount_original || 0),
        exchange_rate_assumed: Number(row.exchange_rate_assumed || 0),
        is_active: row.is_active !== "false",
      }))
    }

    const previousItems = costItems
    setCostItems(items as OperationalCost[])

    const { error: deleteError } = await supabase
      .from("operational_costs")
      .delete()
      .neq("id", "")
    if (deleteError) {
      setCostItems(previousItems)
      toast.error(t("toastClearCostsFailed"))
      return
    }

    if (items.length > 0) {
      const { error: insertError } = await supabase
        .from("operational_costs")
        .insert(items)
      if (insertError) {
        setCostItems(previousItems)
        toast.error(t("toastImportFailed", { message: insertError.message }))
        return
      }
    }

    toast.success(t("toastImported", { count: items.length }))
    setPendingImportFile(null)
  }

  const handleSave = async () => {
    if (!selectedProjectId) return
    setIsSaving(true)
    try {
      const payload = {
        projectId: selectedProjectId,
        title: calculationTitle,
        revenueUsd: parseNumber(revenueUSD),
        exchangeRate: parseNumber(exchangeRate),
        hoursPerDay: parseNumber(hoursPerDay),
        targetMargin: parseNumber(targetMarginPercent),
        phases,
        squad,
        freelanceSquad,
      }

      const result = currentCalculationId
        ? await updateCalculation(currentCalculationId, payload)
        : await saveCalculation(payload)

      if (result.success) {
        if ("data" in result && result.data) {
          setCurrentCalculationId(result.data.id)
        }
        queryClient.invalidateQueries({
          queryKey: ["calculations", selectedProjectId],
        })
        toast.success(t("toastSaved"))
      } else {
        toast.error(t("toastSaveFailed"))
      }
    } catch {
      toast.error(t("toastSaveFailed"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleNew = () => {
    setRevenueUSD("1,000")
    setExchangeRate("15,000")
    setHoursPerDay("8")
    setTargetMarginPercent("40")
    setPhases(DEFAULT_PHASES)
    setSquad([])
    setFreelanceSquad([])
    setCurrentCalculationId(null)
    setCalculationTitle(t("untitledCalculation"))
  }

  const handleLoad = (calc: (typeof savedCalculations)[number]) => {
    setRevenueUSD(formatNumber(String(calc.revenue_usd)))
    setExchangeRate(formatNumber(String(calc.exchange_rate)))
    setHoursPerDay(String(calc.hours_per_day))
    setTargetMarginPercent(String(calc.target_margin))
    setPhases(calc.phases as unknown as Phase[])
    setSquad(calc.squad as unknown as SquadMember[])
    setFreelanceSquad(calc.freelance_squad as unknown as FreelanceMember[])
    setCurrentCalculationId(calc.id)
    setCalculationTitle(calc.title)
    toast.success(t("toastLoaded"))
  }

  const handleDeleteCalculation = async () => {
    if (!pendingDeleteId) return
    const result = await deleteCalculation(pendingDeleteId)
    if (result.success) {
      if (pendingDeleteId === currentCalculationId) {
        setCurrentCalculationId(null)
      }
      queryClient.invalidateQueries({
        queryKey: ["calculations", selectedProjectId],
      })
      toast.success(t("toastDeleted"))
    } else {
      toast.error(t("toastDeleteFailed"))
    }
    setPendingDeleteId(null)
  }

  const calculatorContent = (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
      <div className="space-y-6 md:col-span-7">
        <div>
          <h3 className="text-foreground mb-4 text-sm font-medium">
            {t("calculationHeading")}
          </h3>
          {hideProjectSelector ? (
            <div className="grid grid-cols-1 gap-4 md:flex md:items-end">
              <div className="md:flex-1">
                <Label htmlFor="calcTitle">{t("titleLabel")}</Label>
                <Input
                  id="calcTitle"
                  value={calculationTitle}
                  onChange={(e) => setCalculationTitle(e.target.value)}
                  placeholder={t("untitledCalculation")}
                  className="mt-1 h-7"
                />
              </div>
              <div className="flex gap-3 md:shrink-0">
                <Button
                  onClick={handleSave}
                  disabled={!selectedProjectId || isSaving}
                  className="whitespace-nowrap"
                >
                  {isSaving && <Spinner data-icon="inline-start" />}
                  {tc("save")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNew}
                  className="whitespace-nowrap"
                >
                  <RiAddLine className="mr-2 size-4" /> {t("newCalculation")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:flex md:items-end">
              <div className="grid grid-cols-1 gap-4 md:flex-1 md:grid-cols-2">
                <div>
                  <Label htmlFor="calcTitle">{t("titleLabel")}</Label>
                  <Input
                    id="calcTitle"
                    value={calculationTitle}
                    onChange={(e) => setCalculationTitle(e.target.value)}
                    placeholder={t("untitledCalculation")}
                    className="mt-1 h-7"
                  />
                </div>
                <div>
                  <Label htmlFor="project">{t("projectLabel")}</Label>
                  <Select
                    onValueChange={(v) => v !== null && setSelectedProjectId(v)}
                    value={selectedProjectId}
                    disabled={Boolean(prefilledProjectId)}
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder={t("selectProject")} />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 md:shrink-0">
                <Button
                  onClick={handleSave}
                  disabled={!selectedProjectId || isSaving}
                  className="whitespace-nowrap"
                >
                  {isSaving && <Spinner data-icon="inline-start" />}
                  {tc("save")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNew}
                  className="whitespace-nowrap"
                >
                  <RiAddLine className="mr-2 size-4" /> {t("newCalculation")}
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        <ProjectContextSection
          revenueUSD={revenueUSD}
          exchangeRate={exchangeRate}
          hoursPerDay={hoursPerDay}
          targetMarginPercent={targetMarginPercent}
          onRevenueChange={(val) => setRevenueUSD(formatNumber(val))}
          onExchangeRateChange={(val) => setExchangeRate(formatNumber(val))}
          onHoursPerDayChange={setHoursPerDay}
          onTargetMarginChange={setTargetMarginPercent}
        />

        <Separator className="my-2" />

        <TimelineSection
          phases={phases}
          totalDuration={totalDuration}
          onAddPhase={addPhase}
          onRemovePhase={removePhase}
          onUpdatePhase={updatePhase}
        />

        <Separator className="my-2" />

        <SquadSection
          teamMembers={teamMembers}
          squad={squad}
          selectedMemberToAdd={selectedMemberToAdd}
          onSelectedMemberChange={setSelectedMemberToAdd}
          onAddSquadMember={addSquadMember}
          onRemoveSquadMember={removeSquadMember}
          onUpdateAllocation={updateAllocation}
        />

        <Separator className="my-2" />

        <FreelanceSection
          freelanceSquad={freelanceSquad}
          onAddFreelanceMember={addFreelanceMember}
          onRemoveFreelanceMember={removeFreelanceMember}
          onUpdateFreelanceMember={updateFreelanceMember}
        />

        <Separator className="my-2" />

        <OperationalCostsSection
          costItems={costItems}
          onDownloadTemplateCSV={downloadTemplateCSV}
          onDownloadTemplateJSON={downloadTemplateJSON}
          onExportCSV={exportCostsAsCSV}
          onExportJSON={exportCostsAsJSON}
          onImportFile={setPendingImportFile}
        />

        {selectedProjectId && (
          <>
            <Separator className="my-2" />
            <div>
              <h3 className="text-foreground mb-4 text-sm font-medium">
                {t("savedCalculations")}
              </h3>
              {savedCalculations.length === 0 ? (
                <EmptyState
                  icon={<RiCalculatorLine className="size-5" />}
                  title={t("savedEmptyTitle")}
                  description={t("savedEmptyDescription")}
                />
              ) : (
                <div className="space-y-3">
                  {savedCalculations.map((calc) => (
                    <div
                      key={calc.id}
                      className={`border-border flex items-center justify-between gap-3 rounded-lg border px-4 py-3`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate text-sm font-medium">
                          {calc.title}
                        </p>
                        <p className="text-muted-foreground text-xs font-medium">
                          {format(new Date(calc.created_at), "MMM d, yyyy", {
                            locale: dateLocale,
                          })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleLoad(calc)}
                        >
                          {t("load")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-tertiary-foreground size-6 p-0"
                          onClick={() => setPendingDeleteId(calc.id)}
                        >
                          <RiDeleteBinLine className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="md:col-span-5">
        <FinancialHUD
          grossRevenue={grossRevenue}
          totalLaborCost={totalLaborCost}
          overheadCost={overheadCost}
          freelanceCost={freelanceCost}
          totalCost={totalCost}
          netProfit={netProfit}
          marginPercent={marginPercent}
          targetMargin={targetMargin}
          suggestedPrice={suggestedPrice}
        />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col">
      <div
        className={
          showHeader ? "flex flex-col rounded-xl p-5" : "flex flex-col"
        }
      >
        {calculatorContent}
      </div>

      <ConfirmDialog
        open={pendingImportFile !== null}
        onOpenChange={(open) => {
          if (!open) setPendingImportFile(null)
        }}
        onConfirm={() => {
          if (pendingImportFile) processImport(pendingImportFile)
        }}
        title={t("replaceCostsTitle")}
        description={t("replaceCostsDescription")}
        confirmText={t("importConfirm")}
        cancelText={tc("cancel")}
        variant="destructive"
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null)
        }}
        onConfirm={handleDeleteCalculation}
        title={t("deleteCalculationTitle")}
        description={t("deleteCalculationDescription")}
        confirmText={tc("delete")}
        cancelText={tc("cancel")}
        variant="destructive"
      />
    </div>
  )
}
