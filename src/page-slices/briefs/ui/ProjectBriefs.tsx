"use client"

import { Button } from "@/components/ui/button"
import { accessLevel, canRunProjects } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { replaceUrl } from "@/shared/lib/url-params"
import { RiAddLine } from "@/shared/ui/lucide-icons"
import { useState } from "react"
import { useBriefs } from "../model/data"
import { BriefCreateDialog } from "./BriefCreateDialog"
import { BriefsView } from "./BriefsView"

/**
 * A project's briefs, at the top of its Dokumen (the same ones Dokumen in
 * the Project list shows). Hidden while there are none, except to the
 * people who can make one.
 */
export function ProjectBriefs({ projectId }: { projectId: string }) {
  const t = useT("briefs")
  const { profile } = useUserProfile()
  const canManage = canRunProjects(accessLevel(profile))
  const { data: briefs = [] } = useBriefs(projectId)
  const [createOpen, setCreateOpen] = useState(false)
  if (!briefs.length && !canManage) return null
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{t("sectionProject")}</h2>
        {canManage && (
          <Button variant="ghost" size="sm" onClick={() => setCreateOpen(true)}>
            <RiAddLine data-icon="inline-start" />
            {t("newBrief")}
          </Button>
        )}
      </div>
      {briefs.length > 0 ? (
        <BriefsView
          projectId={projectId}
          canManage={canManage}
          createOpen={createOpen}
          onCreateOpenChange={setCreateOpen}
          search={false}
        />
      ) : (
        <>
          <p className="text-muted-foreground text-sm">{t("projectEmpty")}</p>
          {createOpen && (
            <BriefCreateDialog
              open={createOpen}
              onOpenChange={setCreateOpen}
              defaultProjectId={projectId}
              onCreated={(id) => {
                const params = new URLSearchParams(window.location.search)
                params.set("brief", id)
                replaceUrl(`${window.location.pathname}?${params}`, true)
              }}
            />
          )}
        </>
      )}
    </section>
  )
}
