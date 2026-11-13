import { WikiPageView } from "@/page-slices/wiki/ui/WikiPageView"

export const dynamic = "force-dynamic"

/** One wiki page, edited in place. */
export default async function WikiPageRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <WikiPageView id={id} />
}
