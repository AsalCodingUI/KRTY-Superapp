"use client"

import { getEmployeeKpi } from "@/app/(main)/performance/actions/kpi-actions"
import { useQuery } from "@tanstack/react-query"

/** One person's KPI for a scope ("2026-Q4" or "2026-All"), cached so the
 *  KPI page, its header and the home card share one request. */
export function useEmployeeKpi(userId: string, scope: string) {
  return useQuery({
    queryKey: ["kpi", userId, scope],
    queryFn: () => getEmployeeKpi(userId, scope),
    staleTime: 30_000,
  })
}
