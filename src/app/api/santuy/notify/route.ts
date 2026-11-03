import { cronAuthorized } from "@/shared/lib/cron-auth"
import { runSantuyNotices } from "@/shared/lib/jobs/santuy-notices"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/** Runs Sharing Santuy's notices now (also daily in the server). */
export async function POST(request: NextRequest) {
  if (!cronAuthorized(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  return NextResponse.json(await runSantuyNotices())
}
