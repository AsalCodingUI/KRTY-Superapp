/**
 * The one KPI rule set. Every screen (employee KPI, team list, project page,
 * dashboard) computes through these helpers so the numbers always agree.
 *
 * - SLA: each milestone scores Faster 120 / On Time 100 / Delay 80 of its
 *   weight; SLA % = achieved / (total weight x 100). All on time = 100%.
 * - Kualitas kerja: competencies achieved / competencies checked.
 * - 360: the cycle summary's overall percentage.
 * - Nilai akhir: SLA 40% + 360 15% + Kualitas 45%, each capped at 100. When a
 *   part has no data yet the others are re-weighted, and it's listed as missing.
 */

export type SLAResult = "Faster" | "On Time" | "Delay"

export const SLA_RESULT_PERCENT: Record<SLAResult, number> = {
  Faster: 120,
  "On Time": 100,
  Delay: 80,
}

export const SLA_RESULT_LABELS: Record<SLAResult, string> = {
  Faster: "Lebih cepat",
  "On Time": "Tepat waktu",
  Delay: "Terlambat",
}

/** Default milestones for every project role (weights sum to 100). */
export const DEFAULT_MILESTONES = [
  { name: "Wireframe", weight: 30 },
  { name: "High Fidelity", weight: 60 },
  { name: "Handover", weight: 10 },
] as const

export type KpiPart = "sla" | "review" | "quality"

export const KPI_PARTS: {
  key: KpiPart
  label: string
  description: string
  weight: number
  target: number
}[] = [
  {
    key: "sla",
    label: "SLA project",
    description: "Milestone project selesai tepat waktu",
    weight: 40,
    target: 90,
  },
  {
    key: "review",
    label: "360 review",
    description: "Penilaian dari rekan satu project",
    weight: 15,
    target: 85,
  },
  {
    key: "quality",
    label: "Kualitas kerja",
    description: "Kompetensi yang tercapai di project",
    weight: 45,
    target: 90,
  },
]

type SlaRow = {
  weight_percentage: number | null
  score_achieved?: number | null
  actual_result?: string | null
}

/** Score of one milestone row: weight x result %. */
export function milestoneAchieved(row: SlaRow) {
  const weight = Number(row.weight_percentage) || 0
  if (row.actual_result && row.actual_result in SLA_RESULT_PERCENT) {
    return weight * SLA_RESULT_PERCENT[row.actual_result as SLAResult]
  }
  return Number(row.score_achieved) || 0
}

/** SLA % over any set of milestone rows; null when nothing is scored. */
export function slaPercent(rows: SlaRow[]): number | null {
  const best = rows.reduce(
    (sum, r) => sum + (Number(r.weight_percentage) || 0) * 100,
    0,
  )
  if (best <= 0) return null
  const achieved = rows.reduce((sum, r) => sum + milestoneAchieved(r), 0)
  return (achieved / best) * 100
}

/** Kualitas kerja %; null when no competency has been checked. */
export function qualityPercent(rows: { is_achieved: boolean | null }[]) {
  if (rows.length === 0) return null
  return (rows.filter((r) => r.is_achieved).length / rows.length) * 100
}

export type KpiParts = Record<KpiPart, number | null>

export type FinalScore = {
  score: number | null
  /** Parts without data, left out of the weighting. */
  missing: KpiPart[]
}

export function finalScore(parts: KpiParts): FinalScore {
  let weighted = 0
  let weights = 0
  const missing: KpiPart[] = []
  for (const part of KPI_PARTS) {
    const value = parts[part.key]
    if (value === null || Number.isNaN(value)) {
      missing.push(part.key)
      continue
    }
    weighted += Math.min(100, value) * part.weight
    weights += part.weight
  }
  return { score: weights > 0 ? weighted / weights : null, missing }
}

export type RatingTone =
  | "success"
  | "info"
  | "neutral"
  | "warning"
  | "destructive"

export const RATINGS: { min: number; label: string; tone: RatingTone }[] = [
  { min: 95, label: "Istimewa", tone: "success" },
  { min: 85, label: "Di atas harapan", tone: "info" },
  { min: 75, label: "Sesuai harapan", tone: "neutral" },
  { min: 60, label: "Di bawah harapan", tone: "warning" },
  { min: -Infinity, label: "Perlu perbaikan", tone: "destructive" },
]

export function ratingFor(score: number | null) {
  if (score === null) return null
  return RATINGS.find((r) => score >= r.min) ?? RATINGS[RATINGS.length - 1]
}

/** "84%" or "—" (no data). */
export function formatPercent(value: number | null, digits = 0) {
  if (value === null || Number.isNaN(value)) return "—"
  return `${value.toFixed(digits)}%`
}
