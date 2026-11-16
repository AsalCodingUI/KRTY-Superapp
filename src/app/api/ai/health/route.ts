import { NextResponse, type NextRequest } from "next/server"
import {
  checkAi,
  providerConfig,
  requireStakeholder,
} from "@/shared/api/ai-config"

export const dynamic = "force-dynamic"

/** One AI connection's health (?id=): reachable, latency, model there.
 *  Stakeholders only; nothing secret comes back. */
export async function GET(request: NextRequest) {
  const auth = await requireStakeholder()
  if ("response" in auth) return auth.response
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "bad_request" }, { status: 400 })
  return NextResponse.json(await checkAi(await providerConfig(id)))
}
