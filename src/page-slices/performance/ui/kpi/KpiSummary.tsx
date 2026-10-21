import {
  formatPercent,
  KPI_PARTS,
  type FinalScore,
  type KpiParts,
} from "@/entities/performance/lib/kpi"
import { RatingChip, ScoreBar } from "./RatingChip"

/**
 * Nilai akhir plus its three parts (weight, target, result). Missing parts
 * read "Belum ada data" instead of a red 0%.
 */
export function KpiSummary({
  parts,
  final,
}: {
  parts: KpiParts
  final: FinalScore
}) {
  const missingLabels = KPI_PARTS.filter((p) =>
    final.missing.includes(p.key),
  ).map((p) => p.label)

  return (
    <section className="grid gap-x-12 gap-y-6 py-2 lg:grid-cols-[minmax(0,14rem)_1fr]">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-sm">Nilai akhir</p>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-semibold tabular-nums">
            {final.score === null ? "—" : Math.round(final.score)}
          </span>
          <RatingChip score={final.score} />
        </div>
        <p className="text-muted-foreground/80 text-xs">
          {final.score === null
            ? "Belum ada data di periode ini."
            : missingLabels.length
              ? `Tanpa ${missingLabels.join(" & ").toLowerCase()} (belum ada data).`
              : "SLA 40% · 360 15% · Kualitas 45%"}
        </p>
      </div>

      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
        {KPI_PARTS.map((part) => {
          const value = parts[part.key]
          return (
            <div key={part.key} className="flex min-w-0 flex-col gap-1.5">
              <dt className="text-muted-foreground flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate">{part.label}</span>
                <span className="text-muted-foreground/70 text-xs tabular-nums">
                  bobot {part.weight}%
                </span>
              </dt>
              <dd className="flex items-baseline gap-1.5">
                <span className="text-lg font-medium tabular-nums">
                  {value === null ? (
                    <span className="text-muted-foreground text-sm font-normal">
                      Belum ada data
                    </span>
                  ) : (
                    formatPercent(value)
                  )}
                </span>
                <span className="text-muted-foreground/70 text-xs tabular-nums">
                  target {part.target}%
                </span>
              </dd>
              <ScoreBar value={value} target={part.target} />
            </div>
          )
        })}
      </dl>
    </section>
  )
}
