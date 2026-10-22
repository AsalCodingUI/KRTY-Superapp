"use client"

import { PageHeader } from "@/components/page-header"
import { deleteProject } from "@/app/(main)/projects/actions/project-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ProjectAvatar } from "@/components/project-avatar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { supabase, useInvalidate, useViewer, useWorkspace } from "./data"

// Edit dialog loads on first open.
const ProjectForm = dynamic(() =>
  import("../ProjectForm").then((m) => m.ProjectForm),
)

const CLIENT_FIELDS = [
  { key: "client_name", label: "Nama klien", placeholder: "mis. PT Westura" },
  { key: "client_contact", label: "Kontak", placeholder: "Nama PIC di klien" },
  { key: "client_email", label: "Email", placeholder: "pic@klien.com" },
  { key: "client_phone", label: "Telepon / WhatsApp", placeholder: "08…" },
] as const
type ClientKey = (typeof CLIENT_FIELDS)[number]["key"]

function Card({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <section className="ring-foreground/10 flex flex-col rounded-xl ring-1">
      <header className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">{title}</h2>
          {description && (
            <p className="text-muted-foreground text-xs">{description}</p>
          )}
        </div>
        {action}
      </header>
      {children && <div className="border-t">{children}</div>}
    </section>
  )
}

/** Client contact, project & team, and deleting the project. */
export function ProjectSettings({ projectId }: { projectId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isLoading } = useWorkspace(projectId)
  const viewer = useViewer()
  const invalidate = useInvalidate(projectId)
  const [client, setClient] = useState<Record<ClientKey, string>>({
    client_name: "",
    client_contact: "",
    client_email: "",
    client_phone: "",
  })
  const [saving, setSaving] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editMounted, setEditMounted] = useState(false)
  if (editOpen && !editMounted) setEditMounted(true)
  const [deleting, setDeleting] = useState(false)

  const project = data?.project
  useEffect(() => {
    if (!project) return
    setClient({
      client_name: project.client_name ?? "",
      client_contact: project.client_contact ?? "",
      client_email: project.client_email ?? "",
      client_phone: project.client_phone ?? "",
    })
  }, [project])

  if (isLoading || !project || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }

  const dirty = CLIENT_FIELDS.some(
    ({ key }) => (project[key] ?? "") !== client[key].trim(),
  )

  const saveClient = async () => {
    setSaving(true)
    const { error } = await supabase()
      .from("projects")
      .update(
        Object.fromEntries(
          CLIENT_FIELDS.map(({ key }) => [key, client[key].trim() || null]),
        ),
      )
      .eq("id", projectId)
    setSaving(false)
    if (error) {
      toast.error("Gagal menyimpan data klien.")
      return
    }
    toast.success("Data klien disimpan")
    invalidate("workspace")
    queryClient.invalidateQueries({ queryKey: ["project-summary", projectId] })
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <PageHeader className="pt-6 pb-4" title="Pengaturan" />
      <div className="flex flex-col gap-4 pb-4">
        <div className="flex items-center gap-4 pb-2">
          <ProjectAvatar
            id={project.id}
            name={project.name}
            className="size-12 rounded-xl text-lg"
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">{project.name}</h1>
            <p className="text-muted-foreground text-sm">
              {format(new Date(project.start_date), "d MMM yyyy", {
                locale: idLocale,
              })}{" "}
              –{" "}
              {format(new Date(project.end_date), "d MMM yyyy", {
                locale: idLocale,
              })}
              {project.quarter_id ? ` · ${project.quarter_id}` : ""}
            </p>
          </div>
        </div>

        <Card
          title="Klien"
          description="Siapa klien project ini dan siapa yang dihubungi."
          action={
            viewer.isAdmin && (
              <Button
                size="sm"
                onClick={saveClient}
                disabled={!dirty || saving}
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
            )
          }
        >
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {CLIENT_FIELDS.map(({ key, label, placeholder }) => (
              <label key={key} className="flex flex-col gap-1.5 text-sm">
                <span className="text-muted-foreground text-xs">{label}</span>
                <Input
                  value={client[key]}
                  placeholder={placeholder}
                  disabled={!viewer.isAdmin}
                  onChange={(e) =>
                    setClient({ ...client, [key]: e.target.value })
                  }
                />
              </label>
            ))}
          </div>
        </Card>

        <Card
          title="Tim"
          description="Anggota, peran di project, dan lead."
          action={
            viewer.isAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditOpen(true)}
              >
                Ubah project & tim
              </Button>
            )
          }
        >
          {data.team.length === 0 ? (
            <p className="text-muted-foreground px-4 py-6 text-sm">
              Belum ada anggota.
            </p>
          ) : (
            data.team.map((m) => (
              <div
                key={m.assignmentId}
                className="flex items-center gap-3 border-b px-4 py-2.5 text-sm last:border-b-0"
              >
                <Avatar className="size-7">
                  <AvatarImage src={m.avatar_url || undefined} alt="" />
                  <AvatarFallback className="text-[10px]">
                    {(m.full_name || "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{m.full_name}</span>
                  <span className="text-muted-foreground text-xs">
                    {m.job_title}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">{m.role}</span>
                {m.isLead && (
                  <span className="bg-primary/15 text-primary rounded-sm px-1.5 py-0.5 text-xs">
                    Lead
                  </span>
                )}
              </div>
            ))
          )}
        </Card>

        {viewer.isAdmin && (
          <Card
            title="Hapus project"
            description="Project, tim, tugas, dokumen, library, dan nilai KPI-nya ikut terhapus. Kalau cuma mau disembunyikan, arsipkan saja."
            action={
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleting(true)}
              >
                Hapus project
              </Button>
            }
          />
        )}

        {viewer.isAdmin && (
          <>
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
              title={`Hapus ${project.name}?`}
              description="Semua isi project dihapus permanen dan tidak bisa dikembalikan."
              confirmText="Hapus permanen"
              cancelText="Batal"
              variant="destructive"
              onConfirm={async () => {
                const result = await deleteProject(projectId)
                if (!result.success) {
                  toast.error(result.error)
                  return
                }
                toast.success("Project dihapus")
                router.push("/projects")
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
