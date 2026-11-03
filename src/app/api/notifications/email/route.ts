import { cronAuthorized } from "@/shared/lib/cron-auth"
import { runEmailQueue } from "@/shared/lib/jobs/email-queue"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/** Runs the email queue now (it also runs every minute in the server). */
export async function POST(request: NextRequest) {
  if (!cronAuthorized(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  return NextResponse.json(await runEmailQueue())
}
