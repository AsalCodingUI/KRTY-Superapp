import {
  deleteInvoice,
  getAllInvoices,
  getInvoicesByProject,
  saveInvoice,
  updateInvoice,
  type SaveInvoicePayload,
} from "@/app/(main)/finance/actions/invoice-actions"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  const result = projectId
    ? await getInvoicesByProject(projectId)
    : await getAllInvoices()

  return Response.json(result)
}

export async function POST(request: Request) {
  const payload = (await request.json()) as SaveInvoicePayload
  return Response.json(await saveInvoice(payload))
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: string
    payload?: Partial<SaveInvoicePayload>
  }

  if (!body.id || !body.payload) {
    return Response.json(
      { success: false, error: "Missing id or payload" },
      { status: 400 },
    )
  }

  return Response.json(await updateInvoice(body.id, body.payload))
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id?: string }

  if (!body.id) {
    return Response.json(
      { success: false, error: "Missing invoice id" },
      { status: 400 },
    )
  }

  return Response.json(await deleteInvoice(body.id))
}
