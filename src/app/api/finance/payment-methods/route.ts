import { getT } from "@/shared/i18n/server"
import {
  deletePaymentMethod,
  getPaymentMethods,
  savePaymentMethod,
  updatePaymentMethod,
} from "@/app/(main)/finance/actions/invoice-actions"

export async function GET() {
  return Response.json(await getPaymentMethods())
}

export async function POST(request: Request) {
  const t = await getT("api")
  const body = (await request.json()) as { name?: string }

  if (!body.name?.trim()) {
    return Response.json(
      { success: false, error: t("missingPaymentMethodName") },
      { status: 400 },
    )
  }

  return Response.json(await savePaymentMethod(body.name.trim()))
}

export async function PATCH(request: Request) {
  const t = await getT("api")
  const body = (await request.json()) as { id?: string; name?: string }

  if (!body.id || !body.name?.trim()) {
    return Response.json(
      { success: false, error: t("missingIdOrName") },
      { status: 400 },
    )
  }

  return Response.json(await updatePaymentMethod(body.id, body.name.trim()))
}

export async function DELETE(request: Request) {
  const t = await getT("api")
  const body = (await request.json()) as { id?: string }

  if (!body.id) {
    return Response.json(
      { success: false, error: t("missingPaymentMethodId") },
      { status: 400 },
    )
  }

  return Response.json(await deletePaymentMethod(body.id))
}
