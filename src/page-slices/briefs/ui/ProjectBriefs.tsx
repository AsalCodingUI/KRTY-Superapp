"use client"

import { accessLevel, canRunProjects } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { replaceUrl } from "@/shared/lib/url-params"
import { Section } from "@/page-slices/projects/ui/workspace/row-menu"
import { useBriefs } from "../model/data"
import { BriefCreateDialog } from "./BriefCreateDialog"
import { BriefsView } from "./BriefsView"

/** Who can start a brief (Brief baru in the page's title row). */
export function useCanManageBriefs() {
  const { profile } = useUserProfile()
  return canRunProjects(accessLevel(profile))
}

/**
 * A project's briefs, at the top of its Dokumen (the same ones Dokumen in
 * the Project list shows), as one of its sections ("▾ Brief klien", like
 * the document kinds under it). Nothing while there are none: Brief baru
 * is in the page's title row, beside Dokumen baru.
 */
export function ProjectBriefs({
  projectId,
  createOpen,
  onCreateOpenChange,
}: {
  projectId: string
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
}) {
  const t = useT("briefs")
  const canManage = useCanManageBriefs()
  const { data: briefs = [] } = useBriefs(projectId)
  if (briefs.length > 0)
    return (
      <Section title={t("sectionProject")}>
        <BriefsView
          projectId={projectId}
          canManage={canManage}
          createOpen={createOpen}
          onCreateOpenChange={onCreateOpenChange}
          search={false}
        />
      </Section>
    )
  return createOpen ? (
    <BriefCreateDialog
      open={createOpen}
      onOpenChange={onCreateOpenChange}
      defaultProjectId={projectId}
      onCreated={(id) => {
        const params = new URLSearchParams(window.location.search)
        params.set("brief", id)
        replaceUrl(`${window.location.pathname}?${params}`, true)
      }}
    />
  ) : null
}
