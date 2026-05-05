import {
  archivePolicy,
  createPolicy,
  deletePolicy,
  getPolicies,
  updatePolicy,
  type SavePolicyPayload,
} from "@/app/(main)/policies/actions/policy-actions"
import { createClient } from "@/shared/api/supabase/server"

async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const result = await getPolicies()
  return Response.json(result)
}

export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  const payload = (await request.json()) as SavePolicyPayload
  return Response.json(await createPolicy(payload, user.id))
}

export async function PATCH(request: Request) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    action: "update" | "archive"
    documentId?: string
    versionId?: string
    payload?: SavePolicyPayload
  }

  if (!body.action || !body.documentId) {
    return Response.json(
      { success: false, error: "Missing action or documentId" },
      { status: 400 },
    )
  }

  if (body.action === "archive") {
    return Response.json(await archivePolicy(body.documentId))
  }

  if (body.action === "update") {
    if (!body.versionId || !body.payload) {
      return Response.json(
        { success: false, error: "Missing versionId or payload" },
        { status: 400 },
      )
    }
    return Response.json(
      await updatePolicy(body.documentId, body.versionId, body.payload),
    )
  }

  return Response.json({ success: false, error: "Unknown action" }, { status: 400 })
}

export async function DELETE(request: Request) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  const body = (await request.json()) as { documentId?: string }
  if (!body.documentId) {
    return Response.json(
      { success: false, error: "Missing documentId" },
      { status: 400 },
    )
  }
  return Response.json(await deletePolicy(body.documentId))
}
