import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { accessLevel } from "@/shared/config/access"

/**
 * The AI connections (migrations/ai_providers.sql): OpenAI-compatible
 * routers stakeholders add in Setelan → API & MCP. The default one serves
 * the editors' AI; with none, the server's AI_* env. Keys are encrypted
 * here (AES-256-GCM, a key derived from the server's JWT secret) and never
 * sent to the browser.
 */

export type AiConfig = { baseUrl: string; apiKey: string; model: string }

export type AiProvider = {
  id: string
  name: string
  host: string
  model: string
  is_default: boolean
}

export type AiHealth = {
  status:
    | "ok"
    | "model_missing"
    | "auth_failed"
    | "unreachable"
    | "error"
    | "not_configured"
  latencyMs?: number
  models?: number
  httpStatus?: number
}

function cipherKey() {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) throw new Error("SUPABASE_JWT_SECRET is not set")
  return createHash("sha256").update(`${secret}:ai-providers`).digest()
}

export function encryptKey(plain: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", cipherKey(), iv)
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  return [iv, cipher.getAuthTag(), data]
    .map((b) => b.toString("base64"))
    .join(".")
}

function decryptKey(stored: string) {
  const [iv, tag, data] = stored.split(".").map((p) => Buffer.from(p, "base64"))
  const decipher = createDecipheriv("aes-256-gcm", cipherKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  )
}

export const normalizeBaseUrl = (url: string) => url.trim().replace(/\/+$/, "")
const hostOf = (url: string) => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

function envConfig(): AiConfig | null {
  const baseUrl = process.env.AI_BASE_URL?.trim()
  const apiKey = process.env.AI_API_KEY?.trim()
  const model = process.env.AI_MODEL?.trim()
  return baseUrl && apiKey && model
    ? { baseUrl: normalizeBaseUrl(baseUrl), apiKey, model }
    : null
}

type Row = {
  id: string
  name: string
  base_url: string
  api_key_enc: string
  model: string
  is_default: boolean
}

/** Every connection; the server's env one is added (as default) the first
 *  time, so it shows here and can be removed like the others. */
export async function listProviders(): Promise<AiProvider[]> {
  const admin = createAdminClient()
  const read = async () => {
    const { data, error } = await admin
      .from("ai_providers")
      .select("id, name, base_url, model, is_default")
      .order("created_at")
    if (error) throw error
    return (data ?? []) as Omit<Row, "api_key_enc">[]
  }
  let rows = await read()
  const env = envConfig()
  if (!rows.length && env && !(await seeded())) {
    await admin.from("ai_providers").insert({
      name: hostOf(env.baseUrl).split(".")[0] || "AI",
      base_url: env.baseUrl,
      api_key_enc: encryptKey(env.apiKey),
      model: env.model,
      is_default: true,
    })
    await markSeeded()
    rows = await read()
  }
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    host: hostOf(r.base_url),
    model: r.model,
    is_default: r.is_default,
  }))
}

// Once the env connection was copied in, removing it stays removed.
const SEED_FLAG = "ai_providers_seeded"
async function seeded() {
  const { data } = await createAdminClient()
    .from("app_settings")
    .select("value")
    .eq("key", SEED_FLAG)
    .maybeSingle()
  return Boolean(data)
}
async function markSeeded() {
  await createAdminClient()
    .from("app_settings")
    .upsert({ key: SEED_FLAG, value: true }, { onConflict: "key" })
}

export async function providerConfig(id: string): Promise<AiConfig | null> {
  const { data } = await createAdminClient()
    .from("ai_providers")
    .select("base_url, api_key_enc, model")
    .eq("id", id)
    .maybeSingle()
  if (!data) return null
  return {
    baseUrl: normalizeBaseUrl(data.base_url),
    apiKey: decryptKey(data.api_key_enc),
    model: data.model,
  }
}

/** What the editors' AI uses: the default connection, else the env. */
export async function defaultAiConfig(): Promise<AiConfig | null> {
  try {
    const { data } = await createAdminClient()
      .from("ai_providers")
      .select("base_url, api_key_enc, model")
      .eq("is_default", true)
      .maybeSingle()
    if (data)
      return {
        baseUrl: normalizeBaseUrl(data.base_url),
        apiKey: decryptKey(data.api_key_enc),
        model: data.model,
      }
  } catch {}
  return envConfig()
}

/** Reachable, how fast, and whether the model is there (GET /models). */
export async function checkAi(config: AiConfig | null): Promise<AiHealth> {
  if (!config) return { status: "not_configured" }
  const started = Date.now()
  try {
    const res = await fetch(`${config.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })
    const latencyMs = Date.now() - started
    if (!res.ok)
      return {
        status:
          res.status === 401 || res.status === 403 ? "auth_failed" : "error",
        httpStatus: res.status,
        latencyMs,
      }
    const json = (await res.json().catch(() => null)) as {
      data?: { id: string }[]
    } | null
    const ids = (json?.data ?? []).map((m) => m.id)
    return {
      status:
        ids.length && !ids.includes(config.model) ? "model_missing" : "ok",
      latencyMs,
      models: ids.length,
    }
  } catch {
    return { status: "unreachable", latencyMs: Date.now() - started }
  }
}

/** The signed-in stakeholder's id, or the response to send instead. */
export async function requireStakeholder(): Promise<
  { userId: string } | { response: NextResponse }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return {
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, job_title")
    .eq("id", user.id)
    .maybeSingle()
  if (accessLevel(profile) !== "stakeholder")
    return {
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    }
  return { userId: user.id }
}
