import { Label, TextInput } from "@/shared/ui"

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
  return (
    <div>
      <h3 className="text-label-md text-foreground-primary">Project Context</h3>
      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="revenue">Revenue (USD)</Label>
          <TextInput
            id="revenue"
            type="text"
            value={revenueUSD}
            onChange={(e) => onRevenueChange(e.target.value)}
            placeholder="e.g. 1,000"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="exchangeRate">Exchange Rate (IDR)</Label>
          <TextInput
            id="exchangeRate"
            type="text"
            value={exchangeRate}
            onChange={(e) => onExchangeRateChange(e.target.value)}
            placeholder="e.g. 15,000"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="hours">Daily Workload (Hours)</Label>
          <TextInput
            id="hours"
            type="number"
            value={hoursPerDay}
            onChange={(e) => onHoursPerDayChange(e.target.value)}
            placeholder="e.g. 8"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="targetMargin">Target Margin (%)</Label>
          <TextInput
            id="targetMargin"
            type="number"
            value={targetMarginPercent}
            onChange={(e) => onTargetMarginChange(e.target.value)}
            placeholder="e.g. 40"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  )
}
