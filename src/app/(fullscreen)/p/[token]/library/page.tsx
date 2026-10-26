import { PortalSessionEnded } from "@/page-slices/projects/ui/portal/PortalSessionEnded"
import {
  PortalLibrary,
  type PortalFile,
  type PortalFolder,
} from "@/page-slices/projects/ui/portal/PortalLibrary"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { portalPage } from "../session"

/** Library files outside internal folders. */
export default async function PortalLibraryPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await portalPage(token, "/library")
  if (!session.signedIn) return <PortalSessionEnded />
  const admin = createAdminClient()
  const [{ data: folders }, { data: files }] = await Promise.all([
    admin
      .from("project_folders")
      .select("id, name")
      .eq("project_id", session.project.id)
      .eq("is_internal", false)
      .order("name"),
    admin
      .from("project_files")
      .select("id, name, mime_type, file_size, folder_id, created_at")
      .eq("project_id", session.project.id)
      .order("created_at", { ascending: false }),
  ])
  const shown = new Set((folders ?? []).map((f) => f.id))
  return (
    <PortalLibrary
      assetBase={`/p/${token}`}
      folders={(folders ?? []) as PortalFolder[]}
      files={((files ?? []) as PortalFile[]).filter(
        (f) => !f.folder_id || shown.has(f.folder_id),
      )}
    />
  )
}
