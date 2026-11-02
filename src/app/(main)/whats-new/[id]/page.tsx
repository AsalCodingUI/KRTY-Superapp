import { WhatsNewEntryPage } from "@/page-slices/whats-new/ui/WhatsNewEntryPage"

/** One Yang baru entry and its guide (the entry id is its slug). */
export default async function WhatsNewEntryRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <WhatsNewEntryPage id={id} />
}
