import type { getCompetencies } from "@/app/(main)/performance/actions/competency-actions"
import type {
  getEmployeeKpi,
  getPeriodLock,
  getTeamKpi,
} from "@/app/(main)/performance/actions/kpi-actions"
import type {
  getMyReview,
  getMyReviewOf,
  getReviewMonitoring,
  getReviewStatusFor,
  getReviewSummary,
} from "@/app/(main)/performance/actions/review-actions"

type Out<F extends (...args: never[]) => Promise<unknown>> = Awaited<
  ReturnType<F>
>

/**
 * GET /api/performance/read/<resource>: the same server functions as the
 * actions, but as plain requests so a screen's reads run in parallel
 * (server actions queue one at a time). Throws on a failed request, like a
 * failed action did, so useQuery shows its error state.
 */
async function read<T>(resource: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(
    `/api/performance/read/${resource}${query ? `?${query}` : ""}`,
    { cache: "no-store" },
  )
  if (!res.ok) throw new Error(`Performance read "${resource}" failed`)
  return (await res.json()) as T
}

export const performanceRead = {
  employeeKpi: (userId: string, scope: string) =>
    read<Out<typeof getEmployeeKpi>>("kpi", { userId, scope }),
  teamKpi: (scope: string) =>
    read<Out<typeof getTeamKpi>>("kpi-team", { scope }),
  periodLock: (period: string) =>
    read<Out<typeof getPeriodLock>>("kpi-lock", { period }),
  myReview: (quarter: string) =>
    read<Out<typeof getMyReview>>("my-review", { quarter }),
  myReviewOf: (cycleId: string, revieweeId: string) =>
    read<Out<typeof getMyReviewOf>>("my-review-of", { cycleId, revieweeId }),
  reviewStatusFor: (userId: string, quarter: string) =>
    read<Out<typeof getReviewStatusFor>>("review-status-for", {
      userId,
      quarter,
    }),
  reviewMonitoring: (quarter: string) =>
    read<Out<typeof getReviewMonitoring>>("review-monitoring", { quarter }),
  reviewSummary: (revieweeId: string, quarter: string) =>
    read<Out<typeof getReviewSummary>>("review-summary", {
      revieweeId,
      quarter,
    }),
  competencies: () => read<Out<typeof getCompetencies>>("competencies"),
}
