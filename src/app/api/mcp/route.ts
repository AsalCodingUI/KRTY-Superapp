import { NextResponse, type NextRequest } from "next/server"
import { authenticateApiToken, clientAs } from "@/shared/api/api-token"
import { TOOLS, ToolError } from "./tools"

export const dynamic = "force-dynamic"

/**
 * Kretya's MCP server (Model Context Protocol, Streamable HTTP, stateless
 * JSON responses): Claude Desktop / Code, Cursor, n8n… connect with a
 * personal API token from Setelan → API & MCP (stakeholders):
 *
 *   URL      https://app.kretyastudio.com/api/mcp
 *   Header   Authorization: Bearer krty_…
 *
 * The tools (./tools.ts) act as the token's owner, under their RLS.
 */

const PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"]
const INSTRUCTIONS =
  "Kretya Studio's internal app: projects and tasks, the calendar, leave and attendance, Kretya Wiki, notifications. You act as the token's owner, with their access. Dates are Asia/Jakarta (UTC+7) unless a timezone is given. Look ids up first (list_people, list_projects) before creating or changing things."

/** Requests per token per minute. */
const LIMIT = 120
const hits = new Map<string, { start: number; count: number }>()
function allow(tokenId: string) {
  const now = Date.now()
  const slot = hits.get(tokenId)
  if (!slot || now - slot.start > 60_000) {
    hits.set(tokenId, { start: now, count: 1 })
    return true
  }
  return ++slot.count <= LIMIT
}

type Message = {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  params?: Record<string, unknown>
}

const reply = (id: Message["id"], result: unknown) => ({
  jsonrpc: "2.0",
  id,
  result,
})
const failure = (id: Message["id"], code: number, message: string) => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: { code, message },
})

export async function POST(request: NextRequest) {
  const auth = await authenticateApiToken(request)
  if (!auth)
    return NextResponse.json(failure(null, -32001, "Unauthorized"), {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer realm="kretya"' },
    })
  if (!allow(auth.tokenId))
    return NextResponse.json(failure(null, -32002, "Too many requests"), {
      status: 429,
    })

  const body = (await request.json().catch(() => undefined)) as
    | Message
    | Message[]
    | undefined
  if (!body || typeof body !== "object")
    return NextResponse.json(failure(null, -32700, "Parse error"), {
      status: 400,
    })

  const messages = Array.isArray(body) ? body : [body]
  const db = clientAs(auth)
  const out: unknown[] = []
  for (const msg of messages) {
    // A notification (no id): nothing to answer.
    if (msg.id === undefined || msg.id === null) continue
    out.push(await handle(msg, db, auth))
  }
  if (!out.length) return new NextResponse(null, { status: 202 })
  return NextResponse.json(Array.isArray(body) ? out : out[0])
}

async function handle(
  msg: Message,
  db: ReturnType<typeof clientAs>,
  auth: NonNullable<Awaited<ReturnType<typeof authenticateApiToken>>>,
) {
  switch (msg.method) {
    case "initialize": {
      const asked = String(msg.params?.protocolVersion ?? "")
      return reply(msg.id, {
        protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: {
          name: "kretya",
          title: "Kretya Studio",
          version: "1.0.0",
        },
        instructions: INSTRUCTIONS,
      })
    }
    case "ping":
      return reply(msg.id, {})
    case "tools/list":
      return reply(msg.id, {
        tools: TOOLS.filter((t) => !t.write || auth.scope === "write").map(
          ({ name, description, inputSchema, write }) => ({
            name,
            description,
            inputSchema,
            annotations: { readOnlyHint: !write },
          }),
        ),
      })
    case "tools/call": {
      const name = String(msg.params?.name ?? "")
      const tool = TOOLS.find((t) => t.name === name)
      if (!tool) return failure(msg.id, -32602, `Unknown tool: ${name}`)
      if (tool.write && auth.scope !== "write")
        return reply(msg.id, {
          isError: true,
          content: [{ type: "text", text: "This token is read-only." }],
        })
      const args = (msg.params?.arguments ?? {}) as Record<string, unknown>
      try {
        const result = await tool.run(args, { db, auth })
        return reply(msg.id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: { result },
        })
      } catch (error) {
        return reply(msg.id, {
          isError: true,
          content: [
            {
              type: "text",
              text:
                error instanceof ToolError
                  ? error.message
                  : "Something went wrong running this tool.",
            },
          ],
        })
      }
    }
    default:
      return failure(msg.id, -32601, `Method not found: ${msg.method}`)
  }
}

export function GET() {
  // No server-to-client stream: every answer comes with its request.
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } })
}
