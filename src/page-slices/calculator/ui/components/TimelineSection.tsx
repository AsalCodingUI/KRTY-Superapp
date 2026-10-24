import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useT } from "@/shared/i18n/client"
import { RiAddLine, RiDeleteBinLine } from "@/shared/ui/lucide-icons"
import { Phase } from "../types"

interface TimelineSectionProps {
  phases: Phase[]
  totalDuration: number
  onAddPhase: () => void
  onRemovePhase: (id: string) => void
  onUpdatePhase: (
    id: string,
    field: keyof Phase,
    value: string | number,
  ) => void
}

export function TimelineSection({
  phases,
  totalDuration,
  onAddPhase,
  onRemovePhase,
  onUpdatePhase,
}: TimelineSectionProps) {
  const t = useT("calculator")
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-foreground text-sm font-medium">
            {t("timelineEngine")}
          </h3>
        </div>
        <Badge variant="secondary">
          {t("totalDays", { count: totalDuration })}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="text-muted-foreground hidden grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_40px] gap-4 px-1 text-sm font-medium sm:grid">
          <div>{t("phaseName")}</div>
          <div className="text-center">{t("days")}</div>
          <div className="text-center">{t("buffer")}</div>
          <div />
        </div>

        {phases.map((phase) => (
          <div
            key={phase.id}
            className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_40px] sm:gap-4"
          >
            <Input
              value={phase.name}
              onChange={(e) => onUpdatePhase(phase.id, "name", e.target.value)}
              placeholder={t("phaseName")}
              className="h-7 w-full"
            />
            <Input
              type="number"
              className="w-full text-center"
              value={phase.days}
              onChange={(e) =>
                onUpdatePhase(phase.id, "days", Number(e.target.value))
              }
              placeholder={t("days")}
            />
            <Input
              type="number"
              className="w-full text-center"
              value={phase.buffer}
              onChange={(e) =>
                onUpdatePhase(phase.id, "buffer", Number(e.target.value))
              }
              placeholder={t("buffer")}
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-tertiary-foreground size-8 shrink-0 justify-self-end p-0"
              onClick={() => onRemovePhase(phase.id)}
            >
              <RiDeleteBinLine className="size-4" />
            </Button>
          </div>
        ))}

        <Button variant="outline" className="mt-3 w-full" onClick={onAddPhase}>
          <RiAddLine data-icon="inline-start" /> {t("addProjectPhase")}
        </Button>
      </div>
    </div>
  )
}
