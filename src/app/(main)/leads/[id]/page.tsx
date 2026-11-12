import { LeadViewer } from "@/page-slices/leads/ui/LeadViewer"

export const dynamic = "force-dynamic"

/** One Leads site: in Kretya Flow its web view over the sheet. */
export default async function LeadRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <LeadViewer id={id} />
}
