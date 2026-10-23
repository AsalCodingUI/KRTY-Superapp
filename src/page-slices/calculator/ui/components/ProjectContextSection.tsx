import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useT } from "@/shared/i18n/client"

interface ProjectContextSectionProps {
  revenueUSD: string
  exchangeRate: string
  hoursPerDay: string
  targetMarginPercent: string
  onRevenueChange: (val: string) => void
  onExchangeRateChange: (val: string) => void
  onHoursPerDayChange: (val: string) => void
  onTargetMarginChange: (val: string) => void
}

export function ProjectContextSection({
  revenueUSD,
  exchangeRate,
  hoursPerDay,
  targetMarginPercent,
  onRevenueChange,
  onExchangeRateChange,
  onHoursPerDayChange,
  onTargetMarginChange,
}: ProjectContextSectionProps) {
  const t = useT("calculator")
  return (
    <div>
      <h3 className="text-foreground text-sm font-medium">
        {t("projectContext")}
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="revenue">{t("revenueUsd")}</Label>
          <Input
            id="revenue"
            type="text"
            value={revenueUSD}
            onChange={(e) => onRevenueChange(e.target.value)}
            placeholder={t("examplePlaceholder", { value: "1,000" })}
            className="mt-1 h-7"
          />
        </div>

        <div>
          <Label htmlFor="exchangeRate">{t("exchangeRateIdr")}</Label>
          <Input
            id="exchangeRate"
            type="text"
            value={exchangeRate}
            onChange={(e) => onExchangeRateChange(e.target.value)}
            placeholder={t("examplePlaceholder", { value: "15,000" })}
            className="mt-1 h-7"
          />
        </div>

        <div>
          <Label htmlFor="hours">{t("dailyWorkload")}</Label>
          <Input
            id="hours"
            type="number"
            value={hoursPerDay}
            onChange={(e) => onHoursPerDayChange(e.target.value)}
            placeholder={t("examplePlaceholder", { value: 8 })}
            className="mt-1 h-7"
          />
        </div>

        <div>
          <Label htmlFor="targetMargin">{t("targetMarginPercent")}</Label>
          <Input
            id="targetMargin"
            type="number"
            value={targetMarginPercent}
            onChange={(e) => onTargetMarginChange(e.target.value)}
            placeholder={t("examplePlaceholder", { value: 40 })}
            className="mt-1 h-7"
          />
        </div>
      </div>
    </div>
  )
}
