import { InvoicePrintPage } from "@/page-slices/projects/ui/invoice/InvoicePrintPage"

export const dynamic = "force-dynamic"

export default async function InvoicePrintRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <InvoicePrintPage id={id} />
}
