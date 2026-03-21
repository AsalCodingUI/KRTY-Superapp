import { Button, Label } from "@/shared/ui"
import { OperationalCost } from "../types"
import { formatNumber } from "../utils"

interface OperationalCostsSectionProps {
  costItems: OperationalCost[]
  onDownloadTemplateCSV: () => void
  onDownloadTemplateJSON: () => void
  onExportCSV: () => void
  onExportJSON: () => void
  onImportFile: (file: File) => void
}

export function OperationalCostsSection({
  costItems,
  onDownloadTemplateCSV,
  onDownloadTemplateJSON,
  onExportCSV,
  onExportJSON,
  onImportFile,
}: OperationalCostsSectionProps) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-label-md text-foreground-primary">
            Operational Costs
          </h3>
          <p className="text-body-sm text-foreground-secondary">
            Monthly overhead allocation used for this project.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onDownloadTemplateCSV}>
            Download CSV Template
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onDownloadTemplateJSON}
          >
            Download JSON Template
          </Button>
          <Button variant="secondary" size="sm" onClick={onExportCSV}>
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={onExportJSON}>
            Export JSON
          </Button>
          <Label className="cursor-pointer">
            <span className="sr-only">Import Costs</span>
            <input
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onImportFile(file)
                e.currentTarget.value = ""
              }}
            />
            <Button variant="primary" size="sm" type="button">
              Import Costs
            </Button>
          </Label>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {costItems.length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-body-sm text-foreground-secondary">
              No operational costs loaded yet.
            </p>
          </div>
        )}
        {costItems.map((item) => (
          <div
            key={item.id ?? item.item_name}
            className="border-neutral-primary bg-surface flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3"
          >
            <div>
              <p className="text-label-md text-foreground-primary">
                {item.item_name}
              </p>
              <p className="text-label-xs text-foreground-secondary">
                {item.category}
              </p>
            </div>
            <div className="text-label-md text-foreground-primary">
              Rp {formatNumber(String(item.amount_idr ?? 0))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
