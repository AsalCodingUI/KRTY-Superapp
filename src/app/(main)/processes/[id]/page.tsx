import { ProcessEditorPage } from "@/page-slices/processes/ui/ProcessEditorPage"
import { createClient } from "@/shared/api/supabase/server"
import { linkKey, whereRef } from "@/shared/lib/url-params"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ProcessRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // `brand-identity-1a2b3c4d`, or a full id from an older link.
  const { id: ref } = await params
  const supabase = await createClient()
  const query = whereRef(supabase.from("processes").select("id, name"), ref)
  const { data: process } = query ? await query.maybeSingle() : { data: null }
  if (!process) notFound()
  const key = linkKey(process.name, process.id)
  if (ref !== key) redirect(`/processes/${key}`)
  return <ProcessEditorPage id={process.id} />
}
