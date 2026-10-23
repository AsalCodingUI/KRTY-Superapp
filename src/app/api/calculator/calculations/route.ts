import { getT } from "@/shared/i18n/server"
import {
  deleteCalculation,
  getCalculationsByProject,
  saveCalculation,
  updateCalculation,
  type SaveCalculationPayload,
} from "@/app/(main)/calculator/actions/calculation-actions"

export async function GET(request: Request) {
  const t = await getT("api")
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return Response.json(
      { success: false, error: t("missingProjectId"), data: [] },
      { status: 400 },
    )
  }

  return Response.json(await getCalculationsByProject(projectId))
}

export async function POST(request: Request) {
  const payload = (await request.json()) as SaveCalculationPayload
  return Response.json(await saveCalculation(payload))
}

export async function PATCH(request: Request) {
  const t = await getT("api")
  const body = (await request.json()) as {
    id?: string
    payload?: Partial<SaveCalculationPayload>
  }

  if (!body.id || !body.payload) {
    return Response.json(
      { success: false, error: t("missingIdOrPayload") },
      { status: 400 },
    )
  }

  return Response.json(await updateCalculation(body.id, body.payload))
}

export async function DELETE(request: Request) {
  const t = await getT("api")
  const body = (await request.json()) as { id?: string }

  if (!body.id) {
    return Response.json(
      { success: false, error: t("missingCalculationId") },
      { status: 400 },
    )
  }

  return Response.json(await deleteCalculation(body.id))
}
