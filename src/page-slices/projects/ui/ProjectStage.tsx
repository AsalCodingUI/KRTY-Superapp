"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { createClient } from "@/shared/api/supabase/client"
import { useT } from "@/shared/i18n/client"
import { registerUndo, sameValue, UndoStale } from "@/shared/undo"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronDown, CircleDashed } from "@/components/icons"
import { toast } from "sonner"
import {
  PROJECT_STAGES,
  STAGE_LABEL_KEYS,
  type ProjectStage,
} from "../lib/status"
import { ProjectStageIcon } from "./ProjectStageIcon"

const NONE = "__none"

/** Icon + name, e.g. next to a project's title. */
export function ProjectStageLabel({
  stage,
  className,
}: {
  stage: ProjectStage
  className?: string
}) {
  const t = useT("projects")
  return (
    <span
      className={cn(
        "text-muted-foreground text-meta inline-flex shrink-0 items-center gap-1.5 font-normal tracking-normal",
        className,
      )}
    >
      <ProjectStageIcon stage={stage} className="size-3.5" />
      {t(STAGE_LABEL_KEYS[stage])}
    </span>
  )
}

/** The stages as a pick-one list under a label ("Belum ditentukan" first). */
export function StageMenuItems({
  current,
  onPick,
}: {
  current: ProjectStage | null
  onPick: (stage: ProjectStage | null) => void
}) {
  const t = useT("projects")
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>{t("stage")}</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={current ?? NONE}
        onValueChange={(value) => {
          const next = value === NONE ? null : (value as ProjectStage)
          if (next !== current) onPick(next)
        }}
      >
        {PROJECT_STAGES.map((stage) => (
          <DropdownMenuRadioItem key={stage} value={stage} closeOnClick>
            <ProjectStageIcon stage={stage} />
            {t(STAGE_LABEL_KEYS[stage])}
          </DropdownMenuRadioItem>
        ))}
        <DropdownMenuRadioItem value={NONE} closeOnClick>
          <CircleDashed className="text-muted-foreground" />
          {t("stageNone")}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  )
}

/**
 * The stage by a project's title: a menu to change it for PMs and
 * stakeholders (or "Tahap" to set one), just the label for everyone else.
 */
export function ProjectStageButton({
  stage,
  onPick,
}: {
  stage: ProjectStage | null
  /** Absent: read only. */
  onPick?: (stage: ProjectStage | null) => void
}) {
  const t = useT("projects")
  if (!onPick) return stage ? <ProjectStageLabel stage={stage} /> : null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("setStage")}
        className="hover:bg-accent focus-visible:ring-focus-ring group/stage inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-full px-2 outline-none focus-visible:ring-2"
      >
        {stage ? (
          <ProjectStageLabel stage={stage} />
        ) : (
          <span className="text-muted-foreground text-meta inline-flex items-center gap-1.5 font-normal tracking-normal">
            <CircleDashed className="size-3.5" />
            {t("stage")}
          </span>
        )}
        <ChevronDown className="text-muted-foreground size-3.5 opacity-0 transition-opacity group-hover/stage:opacity-100 group-data-popup-open/stage:opacity-100" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <StageMenuItems current={stage} onPick={onPick} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Saves a project's stage (with ⌘Z) and refreshes what shows it: the
 * lists, the workspace and the sidebar.
 */
export function useSetProjectStage() {
  const t = useT("projects")
  const tu = useT("undo")
  const queryClient = useQueryClient()
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["projects"] }),
      queryClient.invalidateQueries({ queryKey: ["project-workspace"] }),
      queryClient.invalidateQueries({ queryKey: ["sidebar-projects"] }),
    ])
  const write = async (id: string, stage: ProjectStage | null) => {
    const { error } = await createClient()
      .from("projects")
      .update({ stage })
      .eq("id", id)
    if (error) throw error
  }

  return async (
    project: { id: string; name: string; stage?: string | null },
    next: ProjectStage | null,
  ) => {
    const from = (project.stage ?? null) as ProjectStage | null
    try {
      await write(project.id, next)
    } catch {
      toast.error(t("stageFailed"))
      return false
    }
    const label = next ? t(STAGE_LABEL_KEYS[next]) : t("stageNone")
    toast.success(t("stageChanged", { name: project.name, stage: label }))
    void refresh()
    const go = async (
      expected: ProjectStage | null,
      to: ProjectStage | null,
    ) => {
      const { data } = await createClient()
        .from("projects")
        .select("stage")
        .eq("id", project.id)
        .maybeSingle()
      if (!data || !sameValue(data.stage, expected)) throw new UndoStale()
      await write(project.id, to)
      await refresh()
    }
    registerUndo({
      label: tu("projectStage", { name: project.name, stage: label }),
      undo: () => go(next, from),
      redo: () => go(from, next),
    })
    return true
  }
}
