import { PortalSessionEnded } from "@/page-slices/projects/ui/portal/PortalSessionEnded"
import {
  PortalDocuments,
  type PortalDocument,
} from "@/page-slices/projects/ui/portal/PortalDocuments"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { CLIENT_DOC_STATUSES } from "@/shared/lib/portal-docs"
import { portalPage } from "../session"

/** Proposals, contracts and other documents past their draft. */
export default async function PortalDocumentsPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await portalPage(token, "/documents")
  if (!session.signedIn) return <PortalSessionEnded />
  const { data } = await createAdminClient()
    .from("project_documents")
    .select("id, kind, title, status, file_name, file_size, updated_at")
    .eq("project_id", session.project.id)
    .in("status", CLIENT_DOC_STATUSES)
    .not("file_path", "is", null)
    .order("updated_at", { ascending: false })
  return (
    <PortalDocuments
      assetBase={`/p/${token}`}
      documents={(data ?? []) as PortalDocument[]}
    />
  )
}
