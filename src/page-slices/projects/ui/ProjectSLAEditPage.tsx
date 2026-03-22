"use client"

import SLAContainer from "@/app/(main)/sla-generator/components/SLAContainer"
import type { Database } from "@/shared/types/database.types"
import { useRouter } from "next/navigation"

type SLARow = Database["public"]["Tables"]["slas"]["Row"]

export function ProjectSLAEditPage({
  projectId,
  slaId,
  sla,
}: {
  projectId: string
  slaId: string
  sla: SLARow
}) {
  const router = useRouter()

  return (
    <SLAContainer
      slaId={slaId}
      projectId={projectId}
      initialData={{
        client_info: sla.client_info as any,
        agency_info: sla.agency_info as any,
        scope_of_work: sla.scope_of_work as any,
        milestones: sla.milestones as any,
      }}
      onBack={() => router.push(`/projects/${projectId}/slas`)}
    />
  )
}
