import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
          <h3 className="text-foreground text-sm font-medium">
            Operational Costs
          </h3>
          <p className="text-muted-foreground text-sm">
            Monthly overhead allocation used for this project.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onDownloadTemplateCSV}>
            Download CSV Template
          </Button>
          <Button variant="outline" onClick={onDownloadTemplateJSON}>
            Download JSON Template
          </Button>
          <Button variant="outline" onClick={onExportCSV}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={onExportJSON}>
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
            <Button type="button">Import Costs</Button>
          </Label>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {costItems.length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-muted-foreground text-sm">
              No operational costs loaded yet.
            </p>
          </div>
        )}
        {costItems.map((item) => (
          <div
            key={item.id ?? item.item_name}
            className="border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3"
          >
            <div>
              <p className="text-foreground text-sm font-medium">
                {item.item_name}
              </p>
              <p className="text-muted-foreground text-xs font-medium">
                {item.category}
              </p>
            </div>
            <div className="text-foreground text-sm font-medium">
              Rp {formatNumber(String(item.amount_idr ?? 0))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
