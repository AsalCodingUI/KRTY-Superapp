"use client"

import { orEmpty } from "@/components/empty-value"
import {
  saveProjectScores,
  type MilestoneInput,
  type ProjectScoring,
} from "@/app/(main)/performance/actions/project-scoring-actions"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  formatPercent,
  qualityPercent,
  SLA_RESULT_LABELS,
  SLA_RESULT_PERCENT,
  slaPercent,
  type SLAResult,
} from "@/entities/performance/lib/kpi"
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiFileList3Line,
} from "@/shared/ui/lucide-icons"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ListColumns } from "../list"
import { RatingChip } from "./RatingChip"

const RESULTS: SLAResult[] = ["Faster", "On Time", "Delay"]

/** Shared column templates so the headers and rows line up. */
const MILESTONE_GRID =
  "grid grid-cols-[minmax(0,1fr)_5rem_8.5rem] items-center gap-x-4 sm:grid-cols-[minmax(0,1fr)_5.5rem_9rem_3.5rem]"
const COMPETENCY_GRID =
  "grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-x-4"

const RESULT_VARIANTS: Record<SLAResult, "success" | "secondary" | "warning"> =
  {
    Faster: "success",
    "On Time": "secondary",
    Delay: "warning",
  }

/**
 * One member's scores on one project. Admins and the project lead edit
 * (milestones + competencies, saved together); the member sees it read-only.
 */
export function ProjectScoringView({
  assignmentId,
  employeeName,
  project,
  roleInProject,
  initial,
  canEdit,
  backHref,
  backLabel,
}: {
  assignmentId: string
  employeeName: string
  project: { name: string; quarter: string | null; status: string }
  roleInProject: string
  initial: ProjectScoring
  canEdit: boolean
  backHref: string
  backLabel: string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [milestones, setMilestones] = useState<MilestoneInput[]>(
    initial.milestones,
  )
  const [competencies, setCompetencies] = useState(initial.competencies)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const totalWeight = milestones.reduce((s, m) => s + (m.weight || 0), 0)
  // Read-only members only see real numbers, never the defaults.
  const showSla = canEdit || initial.slaScored
  const showQuality = canEdit || initial.qualityScored
  const sla = useMemo(
    () =>
      showSla
        ? slaPercent(
            milestones.map((m) => ({
              weight_percentage: m.weight,
              actual_result: m.result,
            })),
          )
        : null,
    [milestones, showSla],
  )
  const quality = showQuality
    ? qualityPercent(competencies.map((c) => ({ is_achieved: c.isAchieved })))
    : null

  const updateMilestone = (index: number, patch: Partial<MilestoneInput>) => {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    )
    setDirty(true)
  }

  const toggleCompetency = (id: string) => {
    setCompetencies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isAchieved: !c.isAchieved } : c)),
    )
    setDirty(true)
  }

  const save = async () => {
    if (totalWeight !== 100) {
      toast.error(`Total bobot harus 100% (sekarang ${totalWeight}%).`)
      return
    }
    setSaving(true)
    const result = await saveProjectScores(
      assignmentId,
      milestones,
      competencies.map((c) => ({ id: c.id, isAchieved: c.isAchieved })),
    )
    setSaving(false)
    if (!result.success) {
      toast.error(result.error ?? "Gagal menyimpan nilai.")
      return
    }
    toast.success("Nilai tersimpan")
    setDirty(false)
    queryClient.invalidateQueries({ queryKey: ["kpi"] })
    queryClient.invalidateQueries({ queryKey: ["kpi-team"] })
    router.refresh()
  }

  return (
    <div className="flex flex-col pb-4">
      <Link
        href={backHref}
        className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 pt-6 text-sm"
      >
        <RiArrowLeftLine className="size-4" />
        {backLabel}
      </Link>
      <PageHeader
        className="pt-2 pb-4"
        title={project.name}
        actions={
          canEdit && (
            <Button onClick={save} disabled={saving || !dirty}>
              {saving ? "Menyimpan…" : dirty ? "Simpan nilai" : "Tersimpan"}
            </Button>
          )
        }
      />

      <dl className="stat-strip bleed gutter-x border-border border-b py-4">
        {[
          { label: "Anggota", value: employeeName },
          { label: "Peran", value: roleInProject },
          ...(project.quarter
            ? [{ label: "Kuartal", value: project.quarter }]
            : []),
        ].map(({ label, value }) => (
          <div key={label} className="stat-tile">
            <dt className="text-muted-foreground text-sm">{label}</dt>
            <dd className="text-foreground text-xl font-normal tracking-tight">
              {value}
            </dd>
          </div>
        ))}
        {[
          { label: "SLA project", value: sla },
          { label: "Kualitas kerja", value: quality },
        ].map(({ label, value }) => (
          <div key={label} className="stat-tile">
            <dt className="text-muted-foreground text-sm">{label}</dt>
            <dd className="flex items-center gap-2">
              {value === null ? (
                <span className="text-muted-foreground text-xl font-normal tracking-tight">
                  Belum dinilai
                </span>
              ) : (
                <>
                  <span className="text-foreground text-xl font-normal tracking-tight tabular-nums">
                    {orEmpty(formatPercent(value, 1))}
                  </span>
                  <RatingChip score={value} />
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-6 pb-3">
          <h2 className="text-foreground text-sm">Milestone SLA</h2>
          <p className="text-muted-foreground text-[13px]">
            Lebih cepat 120% · Tepat waktu 100% · Terlambat 80% dari bobot
          </p>
        </div>
        {!showSla ? (
          <p className="text-muted-foreground border-t py-6 text-sm">
            Milestone project ini belum dinilai.
          </p>
        ) : (
          <GroupedList>
            <ListColumns grid={MILESTONE_GRID}>
              <span>Milestone</span>
              <span className="text-right">Bobot</span>
              <span>Hasil</span>
              <span className="hidden text-right sm:block">Nilai</span>
            </ListColumns>
            {milestones.map((m, index) => (
              <ListRow
                key={`${m.name}-${index}`}
                className={cn(MILESTONE_GRID, "min-h-14")}
              >
                <span className="text-foreground truncate">{m.name}</span>
                {canEdit ? (
                  <>
                    <div className="flex items-center justify-end gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="h-8 w-16 text-right tabular-nums"
                        value={m.weight}
                        aria-label={`Bobot ${m.name}`}
                        onChange={(e) =>
                          updateMilestone(index, {
                            weight: Number(e.target.value),
                          })
                        }
                      />
                      <span className="text-muted-foreground text-xs">%</span>
                    </div>
                    <Select
                      value={m.result}
                      onValueChange={(v) =>
                        v && updateMilestone(index, { result: v as SLAResult })
                      }
                    >
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue>
                          {(v: SLAResult) => SLA_RESULT_LABELS[v]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent align="end">
                        {RESULTS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {SLA_RESULT_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground text-right tabular-nums">
                      {m.weight}%
                    </span>
                    <div>
                      <Badge variant={RESULT_VARIANTS[m.result]}>
                        {SLA_RESULT_LABELS[m.result]}
                      </Badge>
                    </div>
                  </>
                )}
                <span className="text-foreground hidden text-right tabular-nums sm:block">
                  {(m.weight * SLA_RESULT_PERCENT[m.result]) / 100}
                </span>
              </ListRow>
            ))}
            {canEdit && totalWeight !== 100 && (
              <p className="text-warning gutter-x pt-2 text-xs">
                Total bobot {totalWeight}%, harus 100%.
              </p>
            )}
          </GroupedList>
        )}
      </section>

      <section className="flex flex-col">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-6 pb-3">
          <h2 className="text-foreground text-sm">
            Kompetensi ({roleInProject})
          </h2>
          {showQuality && competencies.length > 0 && (
            <p className="text-muted-foreground text-[13px] tabular-nums">
              {competencies.filter((c) => c.isAchieved).length} dari{" "}
              {competencies.length} tercapai
            </p>
          )}
        </div>
        {competencies.length === 0 ? (
          <EmptyState
            placement="inner"
            title="Belum ada kompetensi"
            description={`Tambahkan kompetensi untuk ${roleInProject} di Competency Library.`}
            icon={<RiFileList3Line className="size-5" />}
          />
        ) : !showQuality ? (
          <p className="text-muted-foreground border-t py-6 text-sm">
            Kompetensi di project ini belum dinilai.
          </p>
        ) : (
          <GroupedList>
            <ListColumns grid={COMPETENCY_GRID}>
              <span>Kompetensi</span>
              <span className="text-right">Status</span>
            </ListColumns>
            {competencies.map((c) => (
              <ListRow key={c.id} className={cn(COMPETENCY_GRID, "min-h-14")}>
                <div className="flex min-w-0 flex-col">
                  <span className="text-foreground truncate">{c.name}</span>
                  {c.description && (
                    <span className="text-tertiary-foreground text-[13px]">
                      {c.description}
                    </span>
                  )}
                </div>
                <div className="flex justify-end">
                  {canEdit ? (
                    <Button
                      variant={c.isAchieved ? "secondary" : "ghost"}
                      size="sm"
                      aria-pressed={c.isAchieved}
                      onClick={() => toggleCompetency(c.id)}
                      className={cn(
                        "w-28 justify-center",
                        c.isAchieved ? "text-success" : "text-muted-foreground",
                      )}
                    >
                      {c.isAchieved && <RiCheckLine data-icon="inline-start" />}
                      {c.isAchieved ? "Tercapai" : "Belum"}
                    </Button>
                  ) : (
                    <Badge variant={c.isAchieved ? "success" : "secondary"}>
                      {c.isAchieved ? "Tercapai" : "Belum"}
                    </Badge>
                  )}
                </div>
              </ListRow>
            ))}
          </GroupedList>
        )}
      </section>
    </div>
  )
}
