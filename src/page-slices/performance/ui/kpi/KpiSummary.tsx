"use client"

import { RollingValue } from "@/components/rolling-value"
import { EmptyValue, orEmpty } from "@/components/empty-value"
import {
  formatPercent,
  KPI_PARTS,
  type FinalScore,
  type KpiParts,
} from "@/entities/performance/lib/kpi"
import { useT } from "@/shared/i18n/client"
import { RatingChip, ScoreBar } from "./RatingChip"

/**
 * Nilai akhir plus its three parts (weight, target, result) as the stats
 * band. Missing parts read "Belum ada data" instead of a red 0%.
 */
export function KpiSummary({
  parts,
  final,
}: {
  parts: KpiParts
  final: FinalScore
}) {
  const t = useT("performance")
  const missingLabels = KPI_PARTS.filter((p) =>
    final.missing.includes(p.key),
  ).map((p) => t(p.label))

  return (
    <dl className="stat-strip bleed gutter-x border-border border-b py-4">
      <div className="stat-tile min-w-44">
        <dt className="text-muted-foreground text-sm">{t("finalScore")}</dt>
        <dd className="flex items-center gap-2">
          <span className="text-foreground text-xl font-normal tracking-tight tabular-nums">
            <RollingValue
              value={final.score === null ? null : Math.round(final.score)}
            >
              {final.score === null ? <EmptyValue /> : Math.round(final.score)}
            </RollingValue>
          </span>
          <RatingChip score={final.score} />
        </dd>
        <dd className="text-tertiary-foreground text-[13px]">
          {final.score === null
            ? t("noDataInPeriod")
            : missingLabels.length
              ? t("summaryWithout", {
                  parts: missingLabels.join(" & ").toLowerCase(),
                })
              : t("summaryWeights")}
        </dd>
      </div>

      {KPI_PARTS.map((part) => {
        const value = parts[part.key]
        return (
          <div key={part.key} className="stat-tile min-w-44">
            <dt className="text-muted-foreground flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate">{t(part.label)}</span>
              <span className="text-tertiary-foreground text-xs tabular-nums">
                {t("weightPercent", { n: part.weight })}
              </span>
            </dt>
            <dd className="flex items-baseline gap-1.5">
              <span className="text-foreground text-xl font-normal tracking-tight tabular-nums">
                <RollingValue value={value}>
                  {orEmpty(formatPercent(value))}
                </RollingValue>
              </span>
              <span className="text-tertiary-foreground text-xs tabular-nums">
                {t("targetPercent", { n: part.target })}
              </span>
            </dd>
            <dd>
              <ScoreBar value={value} target={part.target} />
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
