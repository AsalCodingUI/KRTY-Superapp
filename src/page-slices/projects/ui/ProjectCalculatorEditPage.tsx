"use client"

import { CalculatorPage } from "@/page-slices/calculator"
import type { Database } from "@/shared/types/database.types"
import type { OperationalCost, TeamMember } from "@/page-slices/calculator/ui/types"
import { Button } from "@/shared/ui"
import { RiArrowLeftLine } from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"

type ProjectCalculation = Database["public"]["Tables"]["project_calculations"]["Row"]

export function ProjectCalculatorEditPage({
  projectId,
  calcId,
  project,
  teamMembers,
  operationalCosts,
  calculation,
}: {
  projectId: string
  calcId: string
  project: { id: string; name: string }
  teamMembers: TeamMember[]
  operationalCosts: OperationalCost[]
  calculation: ProjectCalculation
}) {
  const router = useRouter()

  return (
    <div className="flex flex-col">
      <div className="rounded-xxl flex items-center gap-2 px-5 pt-4 pb-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}/calculations`)}
        >
          <RiArrowLeftLine className="mr-2 size-4" />
          Back to Project
        </Button>
      </div>

      <div className="bg-surface-neutral-primary rounded-xxl flex flex-col p-5">
        <CalculatorPage
          teamMembers={teamMembers}
          operationalCosts={operationalCosts}
          projects={[project]}
          prefilledProjectId={project.id}
          hideProjectSelector={true}
          showHeader={false}
          initialCalculation={{
            ...calculation,
            id: calcId,
            revenue_usd: calculation.revenue_usd,
            exchange_rate: calculation.exchange_rate,
            hours_per_day: calculation.hours_per_day,
            target_margin: calculation.target_margin,
            phases: calculation.phases,
            squad: calculation.squad,
            freelance_squad: calculation.freelance_squad,
          }}
        />
      </div>
    </div>
  )
}
