"use client"

import {
  saveProjectScores,
  type MilestoneInput,
  type ProjectScoring,
} from "@/app/(main)/performance/actions/project-scoring-actions"
import { EmptyState } from "@/components/empty-state"
import { ListChip } from "@/components/grouped-list"
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
import { RatingChip } from "./RatingChip"

const RESULTS: SLAResult[] = ["Faster", "On Time", "Delay"]

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
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col gap-3">
        <Link
          href={backHref}
          className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm"
        >
          <RiArrowLeftLine className="size-4" />
          {backLabel}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="text-lg font-semibold">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-sm">
                {employeeName}
              </span>
              <ListChip>{roleInProject}</ListChip>
              {project.quarter && <ListChip>{project.quarter}</ListChip>}
            </div>
          </div>
          {canEdit && (
            <Button onClick={save} disabled={saving || !dirty}>
              {saving ? "Menyimpan…" : dirty ? "Simpan nilai" : "Tersimpan"}
            </Button>
          )}
        </div>
      </div>

      <dl className="flex flex-wrap gap-x-16 gap-y-4">
        {[
          { label: "SLA project", value: sla },
          { label: "Kualitas kerja", value: quality },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-sm">{label}</dt>
            <dd className="flex items-center gap-2">
              {value === null ? (
                <span className="text-muted-foreground">Belum dinilai</span>
              ) : (
                <>
                  <span className="text-lg font-medium tabular-nums">
                    {formatPercent(value, 1)}
                  </span>
                  <RatingChip score={value} />
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col">
        <div className="flex items-baseline justify-between gap-4 pb-2">
          <h2 className="text-sm font-medium">Milestone SLA</h2>
          <p className="text-muted-foreground text-xs">
            Lebih cepat 120% · Tepat waktu 100% · Terlambat 80% dari bobot
          </p>
        </div>
        {!showSla ? (
          <p className="text-muted-foreground border-t py-6 text-sm">
            Milestone project ini belum dinilai.
          </p>
        ) : (
          <div className="-mx-4 flex flex-col">
            {milestones.map((m, index) => (
              <div
                key={`${m.name}-${index}`}
                className="border-border/50 flex min-h-12 items-center gap-3 border-b px-4 py-2 text-sm first:border-t"
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {m.name}
                </span>
                {canEdit ? (
                  <>
                    <div className="flex items-center gap-1.5">
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
                      <SelectTrigger className="h-8 w-36">
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
                    <span className="text-muted-foreground w-16 text-right text-xs tabular-nums">
                      bobot {m.weight}%
                    </span>
                    <ListChip
                      className={cn(
                        m.result === "Faster" && "text-success",
                        m.result === "Delay" && "text-warning",
                      )}
                    >
                      {SLA_RESULT_LABELS[m.result]}
                    </ListChip>
                  </>
                )}
                <span className="w-14 text-right text-xs font-medium tabular-nums">
                  {(m.weight * SLA_RESULT_PERCENT[m.result]) / 100}
                </span>
              </div>
            ))}
            {canEdit && totalWeight !== 100 && (
              <p className="text-warning px-4 pt-2 text-xs">
                Total bobot {totalWeight}%, harus 100%.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="flex flex-col">
        <div className="flex items-baseline justify-between gap-4 pb-2">
          <h2 className="text-sm font-medium">Kompetensi ({roleInProject})</h2>
          {showQuality && competencies.length > 0 && (
            <p className="text-muted-foreground text-xs tabular-nums">
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
          <div className="-mx-4 flex flex-col">
            {competencies.map((c) => (
              <div
                key={c.id}
                className="border-border/50 flex min-h-12 items-center gap-3 border-b px-4 py-2 text-sm first:border-t"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{c.name}</span>
                  {c.description && (
                    <span className="text-muted-foreground text-xs">
                      {c.description}
                    </span>
                  )}
                </div>
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
                  <ListChip className={cn(c.isAchieved && "text-success")}>
                    {c.isAchieved ? "Tercapai" : "Belum"}
                  </ListChip>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
