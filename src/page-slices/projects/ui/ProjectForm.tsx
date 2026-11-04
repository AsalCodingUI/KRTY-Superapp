"use client"

import { DateField } from "@/components/date-field"
import { useProcesses } from "@/page-slices/processes/model/data"
import {
  asStage,
  PROJECT_STAGES,
  STAGE_LABEL_KEYS,
  STATUS_LABEL_KEYS,
  type ProjectStage,
} from "@/page-slices/projects/lib/status"
import {
  getAssignablePeople,
  getEditableProject,
  saveProject,
  type ProjectMemberInput,
} from "@/app/(main)/projects/actions/project-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { Constants, type Database } from "@/shared/types/database.types"
import { RiCloseLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { registerUndo, rowsUndo } from "@/shared/undo"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { accessLevel } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { CategoryPicker } from "./CategoryPicker"
import {
  NameTwinNotice,
  PreviousProjectField,
  type ProjectOption,
} from "./ProjectLineage"
import { ProjectStageIcon } from "./ProjectStageIcon"

type ProjectRole = Database["public"]["Enums"]["project_role_enum"]
type ProjectStatus = Database["public"]["Enums"]["project_status_enum"]
const ROLES = Constants.public.Enums.project_role_enum as readonly ProjectRole[]

/** Sensible default project role from the person's job title. */
function roleFor(jobTitle: string | null): ProjectRole {
  const title = (jobTitle ?? "").toLowerCase()
  if (title.includes("project manager")) return "Project Manager"
  if (title.includes("admin")) return "Admin"
  if (title.includes("brand")) return "Brand Designer"
  if (title.includes("developer")) return "Webflow Developer"
  return "UIX Designer"
}

function quarterOf(date: string) {
  if (!date) return null
  const [y, m] = date.split("-").map(Number)
  return `${y}-Q${Math.floor((m - 1) / 3) + 1}`
}

type Member = ProjectMemberInput & {
  full_name: string | null
  avatar_url: string | null
  job_title: string | null
  scored?: boolean
}

type Draft = {
  name: string
  description: string
  start_date: string
  end_date: string
  status: ProjectStatus
  /** New projects: chosen process (null = the default one, NO_PHASES =
   *  none: an ongoing project without phases). */
  processId: string | null
  categoryId: string | null
  stage: ProjectStage | null
  /** The project this one continues. */
  previousId: string | null
  members: Member[]
}

/** The "Tanpa fase" choice in the process select. */
const NO_PHASES = "__no_phases__"
/** No stage picked yet. */
const NO_STAGE = "__no_stage__"

const EMPTY: Draft = {
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  status: "Planned",
  processId: null,
  categoryId: null,
  stage: null,
  previousId: null,
  members: [],
}

/**
 * Create (PMs, stakeholders) or edit (stakeholders; PMs on their projects)
 * a project and its team.
 */
export function ProjectForm({
  projectId,
  open,
  onOpenChange,
  onSaved,
}: {
  /** null = new project */
  projectId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const t = useT("projects")
  const tc = useT("common")
  const tp = useT("processes")
  const tu = useT("undo")
  const queryClient = useQueryClient()
  const { profile } = useUserProfile()
  // PMs keep themselves on the team, and leave scored members to stakeholders.
  const isPm = accessLevel(profile) === "pm"
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [saving, setSaving] = useState(false)

  // Always fresh: a cached copy would bring back what the last save changed.
  const {
    data: project,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["editable-project", projectId],
    queryFn: () => getEditableProject(projectId!),
    enabled: open && Boolean(projectId),
    staleTime: 0,
  })
  const { data: people = [] } = useQuery({
    queryKey: ["assignable-people"],
    queryFn: () => getAssignablePeople(),
    enabled: open,
  })

  useEffect(() => {
    if (!open) return
    if (!projectId) setDraft(EMPTY)
    else if (project)
      setDraft({
        name: project.name,
        description: project.description ?? "",
        start_date: project.start_date,
        end_date: project.end_date,
        status: project.status,
        processId: null,
        categoryId: project.category_id,
        stage: asStage(project.stage),
        previousId: project.previous_id,
        members: project.members,
      })
  }, [open, projectId, project])

  const { data: processes = [] } = useProcesses(open && !projectId)
  const processValue =
    draft.processId ?? processes.find((p) => p.is_default)?.id ?? null

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const updateMember = (userId: string, patch: Partial<Member>) =>
    set(
      "members",
      draft.members.map((m) =>
        m.userId === userId
          ? { ...m, ...patch }
          : patch.isLead
            ? { ...m, isLead: false }
            : m,
      ),
    )

  const addMember = (userId: string) => {
    const person = people.find((p: { id: string }) => p.id === userId) as
      | {
          id: string
          full_name: string | null
          avatar_url: string | null
          job_title: string | null
        }
      | undefined
    if (!person) return
    set("members", [
      ...draft.members,
      {
        userId: person.id,
        role: roleFor(person.job_title),
        isLead: false,
        full_name: person.full_name,
        avatar_url: person.avatar_url,
        job_title: person.job_title,
      },
    ])
  }

  /**
   * Continue an earlier project: link it and, for a new project, bring its
   * team (roles, lead) and category along. The client follows on save.
   */
  const continueFrom = async (previous: ProjectOption) => {
    set("previousId", previous.id)
    if (projectId) return
    const source = await getEditableProject(previous.id)
    if (!source) return
    setDraft((d) => {
      if (d.previousId !== previous.id) return d
      const have = new Set(d.members.map((m) => m.userId))
      const lead = d.members.some((m) => m.isLead)
      return {
        ...d,
        name: d.name.trim() ? d.name : source.name,
        categoryId: d.categoryId ?? source.category_id,
        members: [
          ...d.members,
          ...source.members
            .filter((m) => !have.has(m.userId))
            .map((m) => ({
              ...m,
              isLead: lead ? false : m.isLead,
              scored: false,
            })),
        ],
      }
    })
  }

  const removeMember = (member: Member) => {
    if (isPm && member.scored)
      return void toast.error(t("errRemoveScoredMember"))
    if (
      member.scored &&
      !window.confirm(
        t("formRemoveScoredConfirm", { name: member.full_name ?? "" }),
      )
    ) {
      return
    }
    set(
      "members",
      draft.members.filter((m) => m.userId !== member.userId),
    )
  }

  const submit = async () => {
    setSaving(true)
    const result = await saveProject(projectId, {
      name: draft.name,
      description: draft.description,
      start_date: draft.start_date,
      end_date: draft.end_date,
      status: draft.status,
      processId: processValue === NO_PHASES ? null : processValue,
      noPhases: processValue === NO_PHASES,
      categoryId: draft.categoryId,
      stage: draft.stage,
      previousId: draft.previousId,
      members: draft.members.map(({ userId, role, isLead }) => ({
        userId,
        role,
        isLead,
      })),
    })
    setSaving(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(projectId ? t("projectSaved") : t("projectCreated"))
    // A new category can be taken back with ⌘Z (shared/undo).
    if (projectId && project && project.category_id !== draft.categoryId)
      registerUndo(
        rowsUndo({
          label: tu("projectCategory", { name: draft.name.trim() }),
          table: "projects",
          rows: [
            {
              id: projectId,
              before: { category_id: project.category_id },
              after: { category_id: draft.categoryId },
            },
          ],
          done: () =>
            Promise.all([
              queryClient.invalidateQueries({ queryKey: ["projects"] }),
              queryClient.invalidateQueries({
                queryKey: ["project-workspace", projectId],
              }),
            ]),
        }),
      )
    onSaved()
    onOpenChange(false)
  }

  const quarter = quarterOf(draft.end_date)
  const available = (
    people as {
      id: string
      full_name: string | null
      job_title: string | null
    }[]
  ).filter((p) => !draft.members.some((m) => m.userId === p.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[35rem]">
        <DialogHeader>
          <DialogTitle>
            {projectId ? t("formEditTitle") : t("newProject")}
          </DialogTitle>
          <DialogDescription>
            {quarter
              ? t("formQuarterHintWith", { quarter })
              : t("formQuarterHint")}
          </DialogDescription>
        </DialogHeader>

        {projectId && isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner className="size-6" />
          </div>
        ) : (
          <div className="scroll-pane scroll-pane-bleed-1 flex min-h-0 flex-1 flex-col gap-4">
            <div className="gap-field flex flex-col">
              <Label htmlFor="project-name">{t("formName")}</Label>
              <Input
                id="project-name"
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={t("formNamePlaceholder")}
              />
              <NameTwinNotice
                name={draft.name}
                selfId={projectId}
                linkedId={draft.previousId}
                onLink={projectId ? undefined : (p) => void continueFrom(p)}
              />
              <PreviousProjectField
                value={draft.previousId}
                selfId={projectId}
                onChange={(p) =>
                  p ? void continueFrom(p) : set("previousId", null)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="gap-field flex flex-col">
                <Label htmlFor="project-start">{t("colStart")}</Label>
                <DateField
                  id="project-start"
                  value={draft.start_date}
                  onChange={(value) => set("start_date", value)}
                />
              </div>
              <div className="gap-field flex flex-col">
                <Label htmlFor="project-end">{t("formEnd")}</Label>
                <DateField
                  id="project-end"
                  value={draft.end_date}
                  min={draft.start_date}
                  onChange={(value) => set("end_date", value)}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {projectId && (
                <div className="gap-field flex flex-col">
                  <Label>{t("colStatus")}</Label>
                  <Select
                    value={draft.status}
                    onValueChange={(v) =>
                      v && set("status", v as ProjectStatus)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v: ProjectStatus) => t(STATUS_LABEL_KEYS[v])}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABEL_KEYS) as ProjectStatus[]).map(
                        (s) => (
                          <SelectItem key={s} value={s}>
                            {t(STATUS_LABEL_KEYS[s])}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {!projectId && processes.length > 0 && (
                <div className="gap-field flex flex-col">
                  <Label>{tp("fieldProcess")}</Label>
                  <Select
                    value={processValue}
                    onValueChange={(v) => v && set("processId", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {processes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem value={NO_PHASES}>
                        {tp("noPhasesOption")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="gap-field flex flex-col">
                <Label htmlFor="project-category">{t("colCategory")}</Label>
                <CategoryPicker
                  id="project-category"
                  value={draft.categoryId}
                  onChange={(id) => set("categoryId", id)}
                />
              </div>
              <div className="gap-field flex flex-col">
                <Label>{t("stage")}</Label>
                <Select
                  value={draft.stage ?? NO_STAGE}
                  onValueChange={(v) =>
                    v &&
                    set("stage", v === NO_STAGE ? null : (v as ProjectStage))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v: string) =>
                        v === NO_STAGE ? (
                          <span className="text-muted-foreground">
                            {t("stageNone")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <ProjectStageIcon stage={v as ProjectStage} />
                            {t(STAGE_LABEL_KEYS[v as ProjectStage])}
                          </span>
                        )
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        <span className="flex items-center gap-2">
                          <ProjectStageIcon stage={stage} />
                          {t(STAGE_LABEL_KEYS[stage])}
                        </span>
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value={NO_STAGE}>{t("stageNone")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!projectId && processes.length > 0 && (
                <p className="text-muted-foreground text-xs sm:col-span-2">
                  {processValue === NO_PHASES
                    ? tp("noPhasesHint")
                    : tp("processHint")}
                </p>
              )}
            </div>
            <div className="gap-field flex flex-col">
              <Label htmlFor="project-desc">{t("formDescription")}</Label>
              <Textarea
                id="project-desc"
                rows={2}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
              <div className="flex items-baseline justify-between">
                <Label>{t("formTeam", { n: draft.members.length })}</Label>
                <span className="text-muted-foreground text-xs">
                  {t("formRoleHint")}
                </span>
              </div>
              {draft.members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarImage src={m.avatar_url || undefined} alt="" />
                    <AvatarFallback className="text-[10px]">
                      {(m.full_name || "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {m.full_name}
                  </span>
                  <Select
                    value={m.role}
                    onValueChange={(v) =>
                      v && updateMember(m.userId, { role: v as ProjectRole })
                    }
                  >
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant={m.isLead ? "secondary" : "ghost"}
                    aria-pressed={m.isLead}
                    className={cn(
                      "w-14",
                      m.isLead ? "text-primary" : "text-muted-foreground",
                    )}
                    onClick={() =>
                      updateMember(m.userId, { isLead: !m.isLead })
                    }
                  >
                    {t("lead")}
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className={cn(
                      isPm && m.userId === profile?.id && "invisible",
                    )}
                    aria-label={t("formRemoveMember", {
                      name: m.full_name ?? "",
                    })}
                    onClick={() => removeMember(m)}
                  >
                    <RiCloseLine />
                  </Button>
                </div>
              ))}
              <Select value={null} onValueChange={(v) => v && addMember(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("formAddMember")} />
                </SelectTrigger>
                <SelectContent>
                  {available.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                      {p.job_title ? ` · ${p.job_title}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button
            onClick={submit}
            // Required fields first; while an existing project loads the
            // draft still holds the previous one, so saving would copy it.
            disabled={
              saving ||
              (Boolean(projectId) && (isFetching || !project)) ||
              !draft.name.trim() ||
              !draft.start_date ||
              !draft.end_date
            }
          >
            {saving ? tc("saving") : projectId ? tc("save") : t("formCreate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
