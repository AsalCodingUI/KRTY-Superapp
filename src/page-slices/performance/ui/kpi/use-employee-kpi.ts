"use client"

import type { getEmployeeKpi } from "@/app/(main)/performance/actions/kpi-actions"
import { useQuery } from "@tanstack/react-query"
import { performanceRead } from "../read"

type EmployeeKpiResult = Awaited<ReturnType<typeof getEmployeeKpi>>

/** One person's KPI for a scope ("2026-Q4" or "2026-All"), cached so the
 *  KPI page, its header and the home card share one request. `initial`:
 *  a result the server already computed, used only for its own scope (the
 *  key changes with the scope, and initialData would seed every new key). */
export function useEmployeeKpi(
  userId: string,
  scope: string,
  initial?: { scope: string; result: EmployeeKpiResult } | null,
) {
  return useQuery({
    queryKey: ["kpi", userId, scope],
    queryFn: () => performanceRead.employeeKpi(userId, scope),
    staleTime: 30_000,
    initialData: initial?.scope === scope ? initial.result : undefined,
  })
}
