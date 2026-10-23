import { ProcessEditorPage } from "@/page-slices/processes/ui/ProcessEditorPage"

export const dynamic = "force-dynamic"

export default async function ProcessRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProcessEditorPage id={id} />
}
