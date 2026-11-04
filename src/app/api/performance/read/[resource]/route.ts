import { getCompetencies } from "@/app/(main)/performance/actions/competency-actions"
import {
  getEmployeeKpi,
  getPeriodLock,
  getTeamKpi,
} from "@/app/(main)/performance/actions/kpi-actions"
import {
  getMyReview,
  getMyReviewOf,
  getReviewMonitoring,
  getReviewStatusFor,
  getReviewSummary,
} from "@/app/(main)/performance/actions/review-actions"
import { NextRequest, NextResponse } from "next/server"

/**
 * The Kinerja pages' reads, as GET. Server actions run one at a time per
 * client, so several useQuery reads on one screen used to wait on each
 * other; plain requests run side by side. Each reader is the same server
 * function the action was (same auth checks inside); writes stay actions.
 */
const readers = {
  kpi: (q) => getEmployeeKpi(q("userId"), q("scope")),
  "kpi-team": (q) => getTeamKpi(q("scope")),
  "kpi-lock": (q) => getPeriodLock(q("period")),
  "my-review": (q) => getMyReview(q("quarter")),
  "my-review-of": (q) => getMyReviewOf(q("cycleId"), q("revieweeId")),
  "review-status-for": (q) => getReviewStatusFor(q("userId"), q("quarter")),
  "review-monitoring": (q) => getReviewMonitoring(q("quarter")),
  "review-summary": (q) => getReviewSummary(q("revieweeId"), q("quarter")),
  competencies: () => getCompetencies(),
} satisfies Record<string, (q: (name: string) => string) => Promise<unknown>>

class MissingParam extends Error {}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource } = await params
  if (!Object.hasOwn(readers, resource)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const search = request.nextUrl.searchParams
  const q = (name: string) => {
    const value = search.get(name)
    if (value === null) throw new MissingParam(name)
    return value
  }
  try {
    const data = await readers[resource as keyof typeof readers](q)
    // Per-user data: never cached by the browser or a proxy.
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    if (error instanceof MissingParam) {
      return NextResponse.json(
        { error: `Missing ${error.message}` },
        { status: 400 },
      )
    }
    console.error(`Performance read "${resource}" failed`, error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
