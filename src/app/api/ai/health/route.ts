import { NextResponse } from "next/server"
import { createClient } from "@/shared/api/supabase/server"
import { accessLevel } from "@/shared/config/access"

export const dynamic = "force-dynamic"

/**
 * The AI router (9router, AI_BASE_URL) as the app sees it: reachable, how
 * fast, whether the configured model is there. Stakeholders only (Setelan →
 * API & MCP). Nothing secret comes back: the router's host and counts.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, job_title")
    .eq("id", user.id)
    .maybeSingle()
  if (accessLevel(profile) !== "stakeholder")
    return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const baseUrl = process.env.AI_BASE_URL?.trim().replace(/\/+$/, "")
  const apiKey = process.env.AI_API_KEY?.trim()
  const model = process.env.AI_MODEL?.trim() ?? null
  const host = baseUrl ? new URL(baseUrl).host : null
  const checkedAt = new Date().toISOString()
  if (!baseUrl || !apiKey)
    return NextResponse.json({
      status: "not_configured",
      host,
      model,
      checkedAt,
    })

  const started = Date.now()
  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })
    const latencyMs = Date.now() - started
    if (!res.ok)
      return NextResponse.json({
        status:
          res.status === 401 || res.status === 403 ? "auth_failed" : "error",
        httpStatus: res.status,
        host,
        model,
        latencyMs,
        checkedAt,
      })
    const json = (await res.json().catch(() => null)) as {
      data?: { id: string }[]
    } | null
    const ids = (json?.data ?? []).map((m) => m.id)
    return NextResponse.json({
      status: model && !ids.includes(model) ? "model_missing" : "ok",
      host,
      model,
      latencyMs,
      models: ids.length,
      checkedAt,
    })
  } catch {
    return NextResponse.json({
      status: "unreachable",
      host,
      model,
      latencyMs: Date.now() - started,
      checkedAt,
    })
  }
}
