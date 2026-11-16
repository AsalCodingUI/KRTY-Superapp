import { NextResponse, type NextRequest } from "next/server"
import {
  checkAi,
  encryptKey,
  listProviders,
  normalizeBaseUrl,
  requireStakeholder,
} from "@/shared/api/ai-config"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { checkCSRF } from "@/shared/lib/utils/security"

export const dynamic = "force-dynamic"

/**
 * The AI connections (Setelan → API & MCP, stakeholders): list, add (only
 * one that answers), make default, remove. Keys never come back.
 */

const bad = (error: string, status = 400) =>
  NextResponse.json({ error }, { status })

export async function GET() {
  const auth = await requireStakeholder()
  if ("response" in auth) return auth.response
  return NextResponse.json({ providers: await listProviders() })
}

export async function POST(request: NextRequest) {
  if (!checkCSRF(request)) return bad("bad_request", 403)
  const auth = await requireStakeholder()
  if ("response" in auth) return auth.response
  const body = await request.json().catch(() => null)
  const name = String(body?.name ?? "")
    .trim()
    .slice(0, 60)
  const baseUrl = normalizeBaseUrl(String(body?.base_url ?? ""))
  const apiKey = String(body?.api_key ?? "").trim()
  const model = String(body?.model ?? "").trim()
  if (!name || !/^https?:\/\/\S+$/.test(baseUrl) || !apiKey || !model)
    return bad("bad_request")

  // Saved only once it answers.
  const health = await checkAi({ baseUrl, apiKey, model })
  if (health.status !== "ok")
    return NextResponse.json({ error: "check_failed", health }, { status: 422 })

  const admin = createAdminClient()
  const { count } = await admin
    .from("ai_providers")
    .select("id", { count: "exact", head: true })
    .eq("is_default", true)
  const { data, error } = await admin
    .from("ai_providers")
    .insert({
      name,
      base_url: baseUrl,
      api_key_enc: encryptKey(apiKey),
      model,
      is_default: !count,
      created_by: auth.userId,
    })
    .select("id")
    .single()
  if (error || !data) return bad("save_failed", 500)
  return NextResponse.json({ id: data.id, health })
}

/** Make a connection the default. */
export async function PATCH(request: NextRequest) {
  if (!checkCSRF(request)) return bad("bad_request", 403)
  const auth = await requireStakeholder()
  if ("response" in auth) return auth.response
  const body = await request.json().catch(() => null)
  const id = String(body?.id ?? "")
  if (!id) return bad("bad_request")
  const admin = createAdminClient()
  await admin
    .from("ai_providers")
    .update({ is_default: false })
    .eq("is_default", true)
  const { error } = await admin
    .from("ai_providers")
    .update({ is_default: true })
    .eq("id", id)
  if (error) return bad("save_failed", 500)
  return NextResponse.json({ ok: true })
}

/** Remove one; if it was the default, the oldest left takes over. */
export async function DELETE(request: NextRequest) {
  if (!checkCSRF(request)) return bad("bad_request", 403)
  const auth = await requireStakeholder()
  if ("response" in auth) return auth.response
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return bad("bad_request")
  const admin = createAdminClient()
  const { data } = await admin
    .from("ai_providers")
    .delete()
    .eq("id", id)
    .select("is_default")
  if (data?.[0]?.is_default) {
    const { data: next } = await admin
      .from("ai_providers")
      .select("id")
      .order("created_at")
      .limit(1)
    if (next?.[0])
      await admin
        .from("ai_providers")
        .update({ is_default: true })
        .eq("id", next[0].id)
  }
  return NextResponse.json({ ok: true })
}
