"use client"

import { ClientPortalCard } from "./ClientPortalCard"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"
import { surfaceClassName } from "@/components/panel"
import { deleteProject } from "@/app/(main)/projects/actions/project-actions"
import { setProjectClient } from "@/app/(main)/clients/actions/client-actions"
import { useClients } from "@/page-slices/clients/model/data"
import { applyProcessToProject } from "@/app/(main)/processes/actions/process-actions"
import { useProcesses } from "@/page-slices/processes/model/data"
import { ClientFormDialog } from "@/page-slices/clients/ui/ClientFormDialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ProjectAvatar } from "@/components/project-avatar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useQueryClient } from "@tanstack/react-query"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format } from "date-fns"
import { ArrowUpRight } from "@/components/icons"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useInvalidate, useViewer, useWorkspace } from "./data"

// Edit dialog loads on first open.
const ProjectForm = dynamic(
  () => import("../ProjectForm").then((m) => m.ProjectForm),
  { loading: () => null },
)

const NO_CLIENT = "__none"
const NEW_CLIENT = "__new"

/** A settings section: title + action in the header, content under it. */
function Card({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <section className={cn(surfaceClassName, "flex flex-col")}>
      <header className="flex items-center justify-between gap-4 px-4 py-3">
        <h2 className="min-w-0 truncate text-sm font-medium">{title}</h2>
        {action}
      </header>
      {children && <div className="border-t">{children}</div>}
    </section>
  )
}

/** Client contact, project & team, and deleting the project. */
export function ProjectSettings({ projectId }: { projectId: string }) {
  const t = useT("projects")
  const tc = useT("common")
  const tcl = useT("clients")
  const tpr = useT("processes")
  const dateLocale = useDateLocale()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isLoading } = useWorkspace(projectId)
  const viewer = useViewer()
  const invalidate = useInvalidate(projectId)
  const [saving, setSaving] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editMounted, setEditMounted] = useState(false)
  if (editOpen && !editMounted) setEditMounted(true)
  const [deleting, setDeleting] = useState(false)
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [editClientOpen, setEditClientOpen] = useState(false)
  const { data: clients = [] } = useClients(viewer.isAdmin)
  const { data: processes = [] } = useProcesses(viewer.isAdmin)
  const [switchTo, setSwitchTo] = useState<{ id: string; name: string } | null>(
    null,
  )

  const project = data?.project

  if (isLoading || !project || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }

  // Client details live on the client record only; the project links to it.
  const linked = data.client
  const linkedRow = clients.find((c) => c.id === linked?.id) ?? null
  const linkClient = async (clientId: string | null) => {
    setSaving(true)
    const result = await setProjectClient(projectId, clientId)
    setSaving(false)
    if (!result.success) return void toast.error(result.error)
    toast.success(tcl("linked"))
    invalidate("workspace")
    queryClient.invalidateQueries({ queryKey: ["project-summary", projectId] })
    queryClient.invalidateQueries({ queryKey: ["clients"] })
  }
  const clientOptions = clients.filter(
    (c) => !c.archived_at || c.id === project.client_id,
  )

  return (
    <div className="flex w-full flex-col">
      <PageHeader className="pt-6 pb-4" title={t("sectionSettings")} />
      <div className="flex flex-col gap-4 pb-4">
        <div className="flex items-center gap-3 pb-1">
          <ProjectAvatar
            id={project.id}
            name={project.name}
            className="size-9 rounded-[5px] text-sm"
          />
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate text-sm font-medium">{project.name}</h2>
            <p className="text-muted-foreground text-[13px] tabular-nums">
              {format(new Date(project.start_date), "d MMM yyyy", {
                locale: dateLocale,
              })}{" "}
              –{" "}
              {format(new Date(project.end_date), "d MMM yyyy", {
                locale: dateLocale,
              })}
              {project.quarter_id ? ` · ${project.quarter_id}` : ""}
            </p>
          </div>
        </div>

        {/* Settings on the left, the team beside them. */}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
          <div className="flex min-w-0 flex-col gap-4">
            <Card
              title={t("factsClient")}
              action={
                viewer.isAdmin && (
                  <Select
                    value={project.client_id ?? NO_CLIENT}
                    disabled={saving}
                    onValueChange={(v) => {
                      if (!v || v === (project.client_id ?? NO_CLIENT)) return
                      if (v === NEW_CLIENT) return setNewClientOpen(true)
                      linkClient(v === NO_CLIENT ? null : v)
                    }}
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-48"
                      aria-label={tcl("fieldClient")}
                    >
                      <SelectValue>
                        {(value: string) =>
                          value === NO_CLIENT
                            ? tcl("noClient")
                            : (clients.find((c) => c.id === value)?.name ??
                              linked?.name)
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value={NO_CLIENT}>
                        {tcl("noClient")}
                      </SelectItem>
                      {clientOptions.length > 0 && <SelectSeparator />}
                      {clientOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem value={NEW_CLIENT}>
                        {tcl("newClient")}…
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )
              }
            >
              {linked ? (
                <dl className="grid gap-x-4 gap-y-3 p-4 text-sm sm:grid-cols-2">
                  {[
                    [t("clientName"), linked.name],
                    [t("factsContact"), linked.contact_name],
                    [t("factsEmail"), linked.email],
                    [t("clientPhone"), linked.phone],
                    [tcl("fieldAddress"), linked.address ?? linked.country],
                    [tcl("fieldCurrency"), linked.currency],
                  ].map(([label, value]) => (
                    <div key={label} className="flex min-w-0 flex-col gap-1">
                      <dt className="text-muted-foreground text-[13px]">
                        {label}
                      </dt>
                      <dd
                        className={cn(
                          "truncate",
                          !value && "text-tertiary-foreground",
                        )}
                      >
                        {value || t("factsNotSet")}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-muted-foreground p-4 text-sm">
                  {tcl("noClientLinkedHint")}
                </p>
              )}
              {viewer.isAdmin && linked && (
                <footer className="flex items-center justify-end gap-2 border-t px-4 py-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    nativeButton={false}
                    render={
                      <Link
                        href={`/clients?client=${linked.id}`}
                        prefetch={false}
                      />
                    }
                  >
                    {tcl("manageClients")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!linkedRow}
                    onClick={() => setEditClientOpen(true)}
                  >
                    {tcl("editClient")}
                  </Button>
                </footer>
              )}
            </Card>

            {viewer.isAdmin && (
              <Card
                title={tpr("fieldProcess")}
                action={
                  <div className="flex items-center gap-1">
                    <Select
                      value={project.process_id ?? null}
                      onValueChange={(v) => {
                        const next = processes.find((p) => p.id === v)
                        if (next && v !== project.process_id)
                          setSwitchTo({ id: next.id, name: next.name })
                      }}
                    >
                      <SelectTrigger
                        size="sm"
                        className="w-48"
                        aria-label={tpr("fieldProcess")}
                      >
                        <SelectValue>
                          {(value: string) =>
                            processes.find((p) => p.id === value)?.name ??
                            tpr("noProcess")
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent align="end">
                        {processes.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={tpr("manageProcesses")}
                      title={tpr("manageProcesses")}
                      className="text-muted-foreground"
                      nativeButton={false}
                      render={
                        <Link
                          href={
                            project.process_id
                              ? `/processes/${project.process_id}`
                              : "/processes"
                          }
                          prefetch={false}
                        />
                      }
                    >
                      <ArrowUpRight />
                    </Button>
                  </div>
                }
              />
            )}

            {viewer.isAdmin && (
              <ClientPortalCard
                projectId={project.id}
                projectName={project.name}
              />
            )}

            {viewer.isAdmin && (
              <Card
                title={t("deleteProject")}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleting(true)}
                  >
                    {t("deleteProject")}
                  </Button>
                }
              />
            )}
          </div>
          <Card
            title={t("colTeam")}
            action={
              viewer.isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditOpen(true)}
                >
                  {t("editProjectAndTeam")}
                </Button>
              )
            }
          >
            {data.team.length === 0 ? (
              <p className="text-muted-foreground px-4 py-6 text-sm">
                {t("noMembersYet")}
              </p>
            ) : (
              data.team.map((m) => (
                <div
                  key={m.assignmentId}
                  className="border-border/50 flex min-h-12 items-center gap-3 border-b px-4 py-2 text-sm last:border-b-0"
                >
                  <Avatar className="size-7">
                    <AvatarImage src={m.avatar_url || undefined} alt="" />
                    <AvatarFallback className="text-[10px]">
                      {(m.full_name || "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{m.full_name}</span>
                    <span className="text-tertiary-foreground truncate text-[13px]">
                      {m.job_title}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-[13px]">
                    {m.role}
                  </span>
                  {m.isLead && <Badge variant="info">{t("lead")}</Badge>}
                </div>
              ))
            )}
          </Card>
        </div>

        {viewer.isAdmin && (
          <>
            <ConfirmDialog
              open={switchTo !== null}
              onOpenChange={(open) => !open && setSwitchTo(null)}
              title={tpr("changeProcessTitle", { name: switchTo?.name ?? "" })}
              description={tpr("changeProcessDescription", {
                name: switchTo?.name ?? "",
              })}
              confirmText={tpr("changeProcessConfirm")}
              cancelText={tc("cancel")}
              onConfirm={async () => {
                if (!switchTo) return
                const result = await applyProcessToProject(
                  projectId,
                  switchTo.id,
                )
                if (!result.success) return void toast.error(result.error)
                toast.success(tpr("processApplied"))
                invalidate("workspace", "steps", "tasks")
                queryClient.invalidateQueries({ queryKey: ["processes"] })
                queryClient.invalidateQueries({
                  queryKey: ["project-summary", projectId],
                })
              }}
            />
            <ClientFormDialog
              client={null}
              open={newClientOpen}
              onOpenChange={setNewClientOpen}
              onSaved={(id) => linkClient(id)}
            />
            <ClientFormDialog
              client={linkedRow}
              open={editClientOpen}
              onOpenChange={setEditClientOpen}
              onSaved={() => {
                invalidate("workspace")
                queryClient.invalidateQueries({ queryKey: ["clients"] })
                queryClient.invalidateQueries({
                  queryKey: ["project-summary", projectId],
                })
              }}
            />
            {editMounted && (
              <ProjectForm
                projectId={projectId}
                open={editOpen}
                onOpenChange={setEditOpen}
                onSaved={() => {
                  invalidate("workspace")
                  queryClient.invalidateQueries({
                    queryKey: ["project-summary", projectId],
                  })
                }}
              />
            )}
            <ConfirmDialog
              open={deleting}
              onOpenChange={setDeleting}
              title={t("deleteTitle", { name: project.name })}
              description={t("deleteDescription")}
              confirmText={t("deletePermanently")}
              cancelText={tc("cancel")}
              variant="destructive"
              onConfirm={async () => {
                const result = await deleteProject(projectId)
                if (!result.success) {
                  toast.error(result.error)
                  return
                }
                toast.success(t("projectDeleted"))
                router.push("/projects")
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
