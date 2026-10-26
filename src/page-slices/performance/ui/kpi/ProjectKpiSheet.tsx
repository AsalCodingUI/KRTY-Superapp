"use client"

import {
  getProjectSheet,
  type ProjectSheetData,
} from "@/app/(main)/performance/actions/project-sheet-actions"
import { ProjectAvatar } from "@/components/project-avatar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { useT } from "@/shared/i18n/client"
import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"
import { ProjectScoringView } from "./ProjectScoringView"

/** Search params that open the sheet: the project, and whose scores. */
export const SHEET_PROJECT = "project"
export const SHEET_MEMBER = "member"

/**
 * Link to the current page with one member's project open in the sheet,
 * keeping the page's own params (period, tab). `member` can be left out
 * where the page already shows one person.
 */
export function projectSheetHref(
  pathname: string,
  params: Record<string, string | null | undefined>,
  projectId: string,
  member?: string,
) {
  const next = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) next.set(k, v)
  next.set(SHEET_PROJECT, projectId)
  if (member) next.set(SHEET_MEMBER, member)
  return `${pathname}?${next}`
}

/**
 * A member's scores on one project in the right sheet (like the
 * notifications panel), opened from any KPI list by `?project=`. The same
 * view as the project page: editors can score and save, the member sees
 * their own read-only.
 */
export function ProjectKpiSheet({
  defaultMember,
}: {
  /** Whose project, when the link doesn't say (a page about one person). */
  defaultMember?: string
}) {
  const t = useT("performance")
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const projectId = params.get(SHEET_PROJECT)
  const member = params.get(SHEET_MEMBER) ?? defaultMember ?? null
  const open = Boolean(projectId && member)

  const { data, isLoading } = useQuery({
    queryKey: ["project-sheet", member, projectId],
    queryFn: () => getProjectSheet(member!, projectId!),
    enabled: open,
    staleTime: 15_000,
  })
  // Keep the last content while the sheet slides out.
  const shown = useRef<ProjectSheetData | null>(null)
  if (open && data?.ok) shown.current = data.data
  const view = open ? (data?.ok ? data.data : null) : shown.current

  const close = () => {
    const next = new URLSearchParams(params)
    next.delete(SHEET_PROJECT)
    next.delete(SHEET_MEMBER)
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()}>
      <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-2xl">
        <SheetHeader className="min-h-16 gap-3 py-3">
          {view ? (
            <>
              <ProjectAvatar
                id={projectId ?? ""}
                name={view.projectName}
                className="size-8 shrink-0 rounded-lg text-xs"
              />
              <div className="flex min-w-0 flex-col">
                <SheetTitle className="truncate">{view.projectName}</SheetTitle>
                <SheetDescription className="truncate">
                  {[view.employeeName, view.roleInProject]
                    .filter(Boolean)
                    .join(" · ")}
                </SheetDescription>
              </div>
            </>
          ) : (
            <SheetTitle className="text-muted-foreground">
              {t("project")}
            </SheetTitle>
          )}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 [--bleed:0.5rem] [--page-gutter:0.5rem] [scrollbar-gutter:stable]">
          {open && isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner className="size-6" />
            </div>
          ) : open && data && !data.ok ? (
            <p className="text-muted-foreground py-16 text-center text-sm">
              {data.error}
            </p>
          ) : view ? (
            <ProjectScoringView
              key={view.assignmentId}
              assignmentId={view.assignmentId}
              employeeName={view.employeeName}
              projectId={projectId ?? ""}
              roleInProject={view.roleInProject}
              initial={view.scoring}
              canEdit={view.canEdit}
              isStakeholder={view.isStakeholder}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
