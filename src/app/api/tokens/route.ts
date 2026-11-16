import { NextResponse, type NextRequest } from "next/server"
import { newApiToken } from "@/shared/api/api-token"
import { createClient } from "@/shared/api/supabase/server"
import { checkCSRF } from "@/shared/lib/utils/security"

/**
 * A new personal API token (Setelan → API & MCP). The token is returned
 * once; only its hash is stored. Stakeholders only (the table's policy).
 * Listing and revoking go straight to api_tokens (RLS: your own).
 */
export async function POST(request: NextRequest) {
  if (!checkCSRF(request))
    return NextResponse.json({ error: "bad_request" }, { status: 403 })
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  const scope = body?.scope === "write" ? "write" : "read"
  const days = Number(body?.expiresInDays)
  if (!name || name.length > 80)
    return NextResponse.json({ error: "bad_request" }, { status: 400 })

  const { token, hash, prefix } = newApiToken()
  const { data, error } = await supabase
    .from("api_tokens")
    .insert({
      profile_id: user.id,
      name,
      scope,
      token_hash: hash,
      prefix,
      expires_at:
        Number.isFinite(days) && days > 0
          ? new Date(Date.now() + days * 86_400_000).toISOString()
          : null,
    })
    .select("id")
    .single()
  if (error || !data)
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  return NextResponse.json({ id: data.id, token })
}
