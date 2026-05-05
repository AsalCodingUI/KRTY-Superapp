"use client"

import type {
  PolicyAudience,
  PolicyDocument,
  PolicyStatus,
} from "@/app/(main)/policies/actions/policy-actions"
import { canManageByRole } from "@/shared/lib/roles"
import { logError } from "@/shared/lib/utils/logger"
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TabNavigation,
  TabNavigationLink,
} from "@/shared/ui"
import {
  RiAddLine,
  RiArchiveLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFileList3Line,
  RiFilePaperLine,
} from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"
import React, { useMemo, useState } from "react"
import { toast } from "sonner"
import { PolicyFormDialog } from "./PolicyFormDialog"

type StakeholderTab = "library" | "versions"
type EmployeeTab = "published" | "updates"



function formatDate(value?: string) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function getStatusVariant(status: PolicyStatus) {
  switch (status) {
    case "Published":
      return "success"
    case "Draft":
      return "warning"
    case "Archived":
      return "zinc"
    default:
      return "default"
  }
}

function getAudienceVariant(audience: PolicyAudience) {
  switch (audience) {
    case "Everyone":
      return "info"
    case "Employee":
      return "success"
    case "Stakeholder":
      return "warning"
    case "Project Team":
      return "zinc"
    default:
      return "default"
  }
}

function PolicyDocumentContent({ content }: { content: unknown }) {
  if (!content) return null
  const json = content as { type: string; content?: unknown[] }
  if (json.type !== "doc") return null

  function renderNode(node: { type: string; text?: string; marks?: { type: string }[]; content?: unknown[]; attrs?: Record<string, unknown> }, idx: number): React.ReactNode {
    switch (node.type) {
      case "heading": {
        const level = (node.attrs?.level as number) ?? 2
        const text = (node.content ?? []).map((n, i) => renderNode(n as typeof node, i))
        if (level === 1) return <h2 key={idx} className="text-heading-md text-foreground-primary mt-4 first:mt-0">{text}</h2>
        if (level === 2) return <h3 key={idx} className="text-label-md text-foreground-primary mt-3 first:mt-0">{text}</h3>
        return <h4 key={idx} className="text-label-sm text-foreground-primary font-medium mt-2 first:mt-0">{text}</h4>
      }
      case "bulletList":
        return <ul key={idx} className="list-disc space-y-1 pl-5 text-body-sm text-foreground-secondary">{(node.content ?? []).map((n, i) => renderNode(n as typeof node, i))}</ul>
      case "orderedList":
        return <ol key={idx} className="list-decimal space-y-1 pl-5 text-body-sm text-foreground-secondary">{(node.content ?? []).map((n, i) => renderNode(n as typeof node, i))}</ol>
      case "listItem":
        return <li key={idx}>{(node.content ?? []).map((n, i) => renderNode(n as typeof node, i))}</li>
      case "paragraph":
        return <p key={idx} className="text-body-sm text-foreground-secondary leading-6">{(node.content ?? []).map((n, i) => renderNode(n as typeof node, i))}</p>
      case "text": {
        let el: React.ReactNode = node.text ?? ""
        const marks = node.marks ?? []
        for (const mark of marks) {
          if (mark.type === "bold") el = <strong key={idx}>{el}</strong>
          else if (mark.type === "italic") el = <em key={idx}>{el}</em>
          else if (mark.type === "underline") el = <u key={idx}>{el}</u>
          else if (mark.type === "link") el = <a key={idx} className="underline text-blue-500" href={(mark as { type: string; attrs?: { href?: string } }).attrs?.href ?? "#"} target="_blank" rel="noreferrer">{el}</a>
        }
        return el
      }
      case "hardBreak":
        return <br key={idx} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-3">
      {(json.content ?? []).map((node, idx) => renderNode(node as Parameters<typeof renderNode>[0], idx))}
    </div>
  )
}

function PolicyListCard({
  policy,
  active,
  onClick,
}: {
  policy: PolicyDocument
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
        active
          ? "border-neutral-primary bg-surface-neutral-secondary"
          : "border-neutral-primary bg-surface-neutral-primary hover:bg-surface-neutral-secondary/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-6 shrink-0 items-center justify-center rounded border border-neutral-primary">
          <RiFilePaperLine className="size-3 text-foreground-secondary" />
        </div>
        <p className="text-label-md text-foreground-primary">{policy.title}</p>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge size="sm" variant={getStatusVariant(policy.latestStatus)}>
            {policy.latestStatus}
          </Badge>
          <Badge size="sm" variant="info">
            {policy.latestVersion}
          </Badge>
          <Badge size="sm" variant={getAudienceVariant(policy.audience)}>
            {policy.audience}
          </Badge>
        </div>
        <span className="shrink-0 text-label-sm text-foreground-tertiary">
          {formatDate(policy.updatedAt)}
        </span>
      </div>
    </button>
  )
}

function EmployeePolicyCard({
  policy,
  active,
  onClick,
}: {
  policy: PolicyDocument
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
        active
          ? "border-neutral-primary bg-surface-neutral-secondary"
          : "border-neutral-primary bg-surface-neutral-primary hover:bg-surface-neutral-secondary/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-6 shrink-0 items-center justify-center rounded border border-neutral-primary">
          <RiFilePaperLine className="size-3 text-foreground-secondary" />
        </div>
        <p className="text-label-md text-foreground-primary">{policy.title}</p>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge size="sm" variant="success">
            Active
          </Badge>
          {policy.requiresAcknowledgement && (
            <Badge size="sm" variant="warning">
              Must Read
            </Badge>
          )}
          <Badge size="sm" variant="info">
            {policy.category}
          </Badge>
          <Badge size="sm" variant={getAudienceVariant(policy.audience)}>
            {policy.audience}
          </Badge>
        </div>
        <span className="shrink-0 text-label-sm text-foreground-tertiary">
          {formatDate(policy.updatedAt)}
        </span>
      </div>
    </button>
  )
}

export function PoliciesPage({
  role,
  policies = [],
}: {
  role?: string | null
  policies?: PolicyDocument[]
}) {
  const router = useRouter()
  const canManage = canManageByRole(role)
  const [stakeholderTab, setStakeholderTab] = useState<StakeholderTab>("library")
  const [employeeTab, setEmployeeTab] = useState<EmployeeTab>("published")
  const [activeId, setActiveId] = useState(policies[0]?.id ?? "")
  const [formOpen, setFormOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<PolicyDocument | null>(null)
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const visiblePolicies = useMemo(() => {
    if (canManage) return policies
    return policies.filter((p) => p.latestStatus === "Published")
  }, [canManage, policies])

  const filteredPolicies = visiblePolicies

  const activePolicy =
    filteredPolicies.find((p) => p.id === activeId) ||
    filteredPolicies[0] ||
    null

  function openCreate() {
    setEditingPolicy(null)
    setFormOpen(true)
  }

  function openEdit(policy: PolicyDocument) {
    setEditingPolicy(policy)
    setFormOpen(true)
  }

  async function handleArchive() {
    if (!pendingArchiveId) return
    try {
      const res = await fetch("/api/policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive", documentId: pendingArchiveId }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error)
      toast.success("Policy archived")
      router.refresh()
    } catch (err) {
      logError("Archive failed", err)
      toast.error("Gagal archive policy")
    } finally {
      setPendingArchiveId(null)
    }
  }

  async function handleDelete() {
    if (!pendingDeleteId) return
    try {
      const res = await fetch("/api/policies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: pendingDeleteId }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error)
      toast.success("Policy deleted")
      router.refresh()
    } catch (err) {
      logError("Delete failed", err)
      toast.error("Gagal delete policy")
    } finally {
      setPendingDeleteId(null)
    }
  }

  const stakeholderStats = [
    {
      label: "Total Documents",
      value: policies.length,
    },
    {
      label: "Published",
      value: policies.filter((p) => p.latestStatus === "Published").length,
    },
    {
      label: "Drafts",
      value: policies.filter((p) => p.latestStatus === "Draft").length,
    },
    {
      label: "Need Ack",
      value: policies.filter((p) => p.requiresAcknowledgement).length,
    },
  ]

  const employeeStats = [
    {
      label: "Available Policies",
      value: visiblePolicies.length,
    },
    {
      label: "Must Read",
      value: visiblePolicies.filter((p) => p.requiresAcknowledgement).length,
    },
    {
      label: "Recently Updated",
      value: visiblePolicies.filter((p) => {
        const d = new Date(p.updatedAt)
        const now = new Date()
        return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
      }).length,
    },
  ]

  return (
    <div className="flex flex-col xl:sticky xl:top-0 xl:h-screen xl:overflow-hidden">
      <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
        <RiFilePaperLine className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">
          {canManage ? "Policy Management" : "Policy Handbook"}
        </p>
      </div>

      <div className="flex flex-col rounded-xxl bg-surface-neutral-primary xl:min-h-0 xl:flex-1 xl:overflow-hidden">
        {canManage ? (
          <>
            <div className="grid grid-cols-1 gap-lg px-5 py-2 sm:grid-cols-2 lg:grid-cols-4">
              {stakeholderStats.map((item) => (
                <div
                  key={item.label}
                  className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3"
                >
                  <p className="text-label-sm text-foreground-secondary">
                    {item.label}
                  </p>
                  <p className="text-heading-md text-foreground-primary">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-neutral-primary border-b px-5 pt-2">
              <div className="space-y-3 pb-3 xl:hidden">
                <Select
                  value={stakeholderTab}
                  onValueChange={(value) =>
                    setStakeholderTab(value as StakeholderTab)
                  }
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="library">Library</SelectItem>
                    <SelectItem value="versions">Version Timeline</SelectItem>
                  </SelectContent>
                </Select>

                <Button leadingIcon={<RiAddLine />} onClick={openCreate}>
                  New policy
                </Button>
              </div>

              <div className="hidden items-start justify-between gap-4 xl:flex">
                <TabNavigation className="border-b-0" value={stakeholderTab}>
                  <TabNavigationLink
                    active={stakeholderTab === "library"}
                    onClick={() => setStakeholderTab("library")}
                  >
                    Library
                  </TabNavigationLink>
                  <TabNavigationLink
                    active={stakeholderTab === "versions"}
                    onClick={() => setStakeholderTab("versions")}
                  >
                    Version Timeline
                  </TabNavigationLink>
                </TabNavigation>

                <Button leadingIcon={<RiAddLine />} onClick={openCreate}>
                  New policy
                </Button>
              </div>
            </div>

            <div className="p-5 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-hidden">
              {stakeholderTab === "library" ? (
                <div className="grid grid-cols-1 gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[0.8fr_1.2fr]">
                  <section className="space-y-4 xl:overflow-y-auto">
                    {filteredPolicies.length === 0 ? (
                      <EmptyState
                        placement="inner"
                        icon={<RiFilePaperLine className="size-5" />}
                        title="No policies found"
                        description="Coba ubah kata kunci pencarian atau tambahkan policy baru."
                      />
                    ) : (
                      filteredPolicies.map((policy) => (
                        <PolicyListCard
                          key={policy.id}
                          policy={policy}
                          active={policy.id === activePolicy?.id}
                          onClick={() => setActiveId(policy.id)}
                        />
                      ))
                    )}
                  </section>

                  <section className="xl:flex xl:min-h-0 xl:flex-col">
                    {activePolicy ? (
                      <>
                        <Card className="flex min-h-0 flex-col overflow-hidden px-4 py-4 xl:flex-1">
                          <div className="flex-none space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="info">{activePolicy.category}</Badge>
                              <Badge
                                variant={getStatusVariant(activePolicy.latestStatus)}
                              >
                                {activePolicy.latestStatus}
                              </Badge>
                              <Badge
                                variant={getAudienceVariant(activePolicy.audience)}
                              >
                                {activePolicy.audience}
                              </Badge>
                            </div>

                            <div>
                              <h3 className="text-heading-md text-foreground-primary">
                                {activePolicy.title}
                              </h3>
                              <p className="text-body-sm text-foreground-secondary mt-2">
                                {activePolicy.summary}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <Card className="px-4 py-3">
                                <p className="text-label-sm text-foreground-secondary">
                                  Owner
                                </p>
                                <p className="text-label-md text-foreground-primary mt-1">
                                  {activePolicy.ownerLabel}
                                </p>
                              </Card>
                              <Card className="px-4 py-3">
                                <p className="text-label-sm text-foreground-secondary">
                                  Effective Date
                                </p>
                                <p className="text-label-md text-foreground-primary mt-1">
                                  {formatDate(activePolicy.effectiveDate)}
                                </p>
                              </Card>
                            </div>
                          </div>

                          <div className="border-neutral-primary mt-4 min-h-0 flex-1 overflow-y-auto border-t pt-4">
                            <PolicyDocumentContent content={activePolicy.content} />
                          </div>

                          <div className="mt-4 flex flex-none flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              leadingIcon={<RiEditLine />}
                              onClick={() => openEdit(activePolicy)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              leadingIcon={<RiArchiveLine />}
                              onClick={() => setPendingArchiveId(activePolicy.id)}
                            >
                              Archive
                            </Button>
                            <Button
                              variant="secondary"
                              leadingIcon={<RiDeleteBinLine />}
                              onClick={() => setPendingDeleteId(activePolicy.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </Card>

                      </>
                    ) : (
                      <EmptyState
                        placement="inner"
                        icon={<RiFileList3Line className="size-5" />}
                        title="Select a policy"
                        description="Pilih salah satu policy untuk lihat detail dan action management."
                      />
                    )}
                  </section>
                </div>
              ) : activePolicy ? (
                <section className="space-y-4">
                  {activePolicy.versions.map((version) => (
                    <Card key={version.id} className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-label-md text-foreground-primary">
                          {activePolicy.title}
                        </p>
                        <Badge
                          size="sm"
                          variant={getStatusVariant(version.status)}
                        >
                          {version.status}
                        </Badge>
                        <Badge size="sm" variant="info">
                          {version.versionNumber}
                        </Badge>
                      </div>
                      <p className="text-body-sm text-foreground-secondary mt-2">
                        {version.changeSummary}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-label-sm text-foreground-tertiary">
                        <span>{formatDate(version.createdAt)}</span>
                        <span>{formatDate(version.createdAt)}</span>
                        {version.effectiveDate && (
                          <span>Effective {formatDate(version.effectiveDate)}</span>
                        )}
                      </div>
                    </Card>
                  ))}
                </section>
              ) : (
                <EmptyState
                  placement="inner"
                  icon={<RiFileList3Line className="size-5" />}
                  title="No version selected"
                  description="Pilih policy dari library untuk lihat version timeline."
                />
              )}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-lg px-5 py-2 sm:grid-cols-2 lg:grid-cols-3">
              {employeeStats.map((item) => (
                <div
                  key={item.label}
                  className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3"
                >
                  <p className="text-label-sm text-foreground-secondary">
                    {item.label}
                  </p>
                  <p className="text-heading-md text-foreground-primary">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-5 pt-2">
              <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-2 rounded-lg border px-4 py-4">
                <p className="text-label-md text-foreground-primary">
                  Reading View
                </p>
                <p className="text-body-sm text-foreground-secondary">
                  Karyawan hanya melihat policy yang sudah published. Fokusnya
                  baca cepat, cari aturan yang relevan, dan lihat perubahan
                  terbaru tanpa akses edit.
                </p>
              </div>
            </div>

            <div className="border-neutral-primary border-b px-5 pt-2">
              <div className="space-y-3 pb-3 xl:hidden">
                <Select
                  value={employeeTab}
                  onValueChange={(value) => setEmployeeTab(value as EmployeeTab)}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published Library</SelectItem>
                    <SelectItem value="updates">Latest Updates</SelectItem>
                  </SelectContent>
                </Select>

              </div>

              <div className="hidden items-start justify-between gap-4 xl:flex">
                <TabNavigation className="border-b-0" value={employeeTab}>
                  <TabNavigationLink
                    active={employeeTab === "published"}
                    onClick={() => setEmployeeTab("published")}
                  >
                    Published Library
                  </TabNavigationLink>
                  <TabNavigationLink
                    active={employeeTab === "updates"}
                    onClick={() => setEmployeeTab("updates")}
                  >
                    Latest Updates
                  </TabNavigationLink>
                </TabNavigation>

              </div>
            </div>

            <div className="p-5 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-hidden">
              {employeeTab === "published" ? (
                <div className="grid grid-cols-1 gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[0.8fr_1.2fr]">
                  <section className="space-y-4 xl:overflow-y-auto">
                    {filteredPolicies.length === 0 ? (
                      <EmptyState
                        placement="inner"
                        icon={<RiFilePaperLine className="size-5" />}
                        title="No published policies"
                        description="Belum ada policy published yang cocok dengan pencarianmu."
                      />
                    ) : (
                      filteredPolicies.map((policy) => (
                        <EmployeePolicyCard
                          key={policy.id}
                          policy={policy}
                          active={policy.id === activePolicy?.id}
                          onClick={() => setActiveId(policy.id)}
                        />
                      ))
                    )}
                  </section>

                  <section className="xl:flex xl:min-h-0 xl:flex-col">
                    {activePolicy ? (
                      <Card className="flex min-h-0 flex-col overflow-hidden px-4 py-4 xl:flex-1">
                        <div className="flex-none space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="success">Published</Badge>
                            <Badge variant="info">{activePolicy.category}</Badge>
                            <Badge
                              variant={getAudienceVariant(activePolicy.audience)}
                            >
                              {activePolicy.audience}
                            </Badge>
                            {activePolicy.requiresAcknowledgement && (
                              <Badge variant="warning">Must Read</Badge>
                            )}
                          </div>

                          <div>
                            <h3 className="text-heading-md text-foreground-primary">
                              {activePolicy.title}
                            </h3>
                            <p className="text-body-sm text-foreground-secondary mt-2">
                              {activePolicy.summary}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Card className="px-4 py-3">
                              <p className="text-label-sm text-foreground-secondary">
                                Effective Date
                              </p>
                              <p className="text-label-md text-foreground-primary mt-1">
                                {formatDate(activePolicy.effectiveDate)}
                              </p>
                            </Card>
                            <Card className="px-4 py-3">
                              <p className="text-label-sm text-foreground-secondary">
                                Current Version
                              </p>
                              <p className="text-label-md text-foreground-primary mt-1">
                                {activePolicy.latestVersion}
                              </p>
                            </Card>
                          </div>

                          <Card className="px-4 py-3">
                            <p className="text-label-sm text-foreground-secondary">
                              Last Updated
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <p className="text-label-md text-foreground-primary">
                                {formatDate(activePolicy.updatedAt)}
                              </p>
                              <Badge size="sm" variant="zinc">
                                {activePolicy.ownerLabel}
                              </Badge>
                            </div>
                          </Card>
                        </div>

                        <div className="border-neutral-primary mt-4 min-h-0 flex-1 overflow-y-auto border-t pt-4">
                          <PolicyDocumentContent content={activePolicy.content} />
                        </div>

                      </Card>
                    ) : (
                      <EmptyState
                        placement="inner"
                        icon={<RiFileList3Line className="size-5" />}
                        title="Select a policy"
                        description="Pilih salah satu policy untuk lihat ringkasannya."
                      />
                    )}
                  </section>
                </div>
              ) : activePolicy ? (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 rounded-lg border border-neutral-primary px-4 py-3">
                    <RiFileList3Line className="size-4 text-foreground-secondary" />
                    <p className="text-body-sm text-foreground-secondary">
                      Update feed menampilkan ringkasan perubahan terbaru dari
                      policy yang sudah aktif.
                    </p>
                  </div>
                  <Card className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-label-md text-foreground-primary">
                        {activePolicy.title}
                      </p>
                      <Badge size="sm" variant="success">
                        Current Version
                      </Badge>
                      <Badge size="sm" variant="info">
                        {activePolicy.latestVersion}
                      </Badge>
                    </div>
                    <p className="text-body-sm text-foreground-secondary mt-2">
                      {activePolicy.versions[0]?.changeSummary || "No change note."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-label-sm text-foreground-tertiary">
                      <span>Owner: {activePolicy.ownerLabel}</span>
                      <span>{formatDate(activePolicy.updatedAt)}</span>
                      <span>Effective {formatDate(activePolicy.effectiveDate)}</span>
                    </div>
                  </Card>
                </section>
              ) : (
                <EmptyState
                  placement="inner"
                  icon={<RiFilePaperLine className="size-5" />}
                  title="No update selected"
                  description="Pilih policy dari library untuk lihat update terbaru."
                />
              )}
            </div>
          </>
        )}
      </div>

      <PolicyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        policy={editingPolicy}
      />

      <ConfirmDialog
        open={pendingArchiveId !== null}
        onOpenChange={(open) => { if (!open) setPendingArchiveId(null) }}
        onConfirm={handleArchive}
        title="Archive policy?"
        description="Policy akan disembunyikan dari semua user. Bisa di-restore melalui database."
        confirmText="Archive"
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null) }}
        onConfirm={handleDelete}
        title="Delete policy?"
        description="Policy akan dihapus permanen beserta semua versinya. Aksi ini tidak bisa dibatalkan."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}
