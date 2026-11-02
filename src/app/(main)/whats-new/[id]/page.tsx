import { siteConfig } from "@/app/siteConfig"
import { redirect } from "next/navigation"

/** Old entry links (/whats-new/<id>): the entry opens in its window over
 *  the list now. */
export default async function WhatsNewEntryRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`${siteConfig.baseLinks.whatsNew}?entry=${encodeURIComponent(id)}`)
}
