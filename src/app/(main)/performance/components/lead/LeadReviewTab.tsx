"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { AvatarGroup, AvatarOverflow } from "@/components/avatar-group"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { TableSection } from "@/components/table-section"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { RiCloseLine, RiTeamLine } from "@/shared/ui/lucide-icons"
import { format, isValid } from "date-fns"
import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ProjectScoringClient,
  type ProjectScoringClientHandle,
} from "../../employee/[id]/project/[projectId]/ProjectScoringClient"

interface LeadProject {
  id: string
  name: string
  quarter_id: string | null
  status: string | null
  start_date: string | null
  end_date: string | null
  members: Array<{
    id: string
    name: string | null
    avatar: string | null
    jobTitle: string | null
    isLead: boolean
  }>
}

const getProjectStatusVariant = (status: string | null) => {
  const normalized = (status || "").toLowerCase()
  if (normalized === "active") return "success" as const
  if (normalized === "completed") return "info" as const
  return "secondary" as const
}

export function LeadReviewTab() {
  const supabase = useMemo(() => createClient(), [])
  const { profile, loading: profileLoading } = useUserProfile()
  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ["lead-projects", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      const { data: leadAssignments, error: leadError } = await supabase
        .from("project_assignments")
        .select(
          "project_id, projects(id,name,quarter_id,status,start_date,end_date)",
        )
        .eq("user_id", profile.id)
        .eq("is_lead", true)

      let primaryAssignments = leadAssignments
      if (leadError || !leadAssignments || leadAssignments.length === 0) {
        const { data: roleAssignments, error: roleError } = await supabase
          .from("project_assignments")
          .select(
            "project_id, projects(id,name,quarter_id,status,start_date,end_date)",
          )
          .eq("user_id", profile.id)
          .in("role_in_project", ["Project Manager", "Admin"])

        if (roleError || !roleAssignments || roleAssignments.length === 0) {
          return []
        }

        primaryAssignments = roleAssignments
      }

      if (!primaryAssignments) return []

      const projectIds = primaryAssignments
        .map((row: { project_id: string }) => row.project_id)
        .filter(Boolean) as string[]

      const { data: assignments, error: assignmentError } = await supabase
        .from("project_assignments")
        .select("project_id,is_lead,profiles(id,full_name,avatar_url,job_title)")
        .in("project_id", projectIds)

      if (assignmentError) return []

      const projectMap = new Map<string, LeadProject>()
      primaryAssignments.forEach((row: { projects: unknown }) => {
        // Supabase infers projects as array but it's actually a single object from JOIN
        const project = row.projects as unknown as {
          id: string
          name: string
          quarter_id: string | null
          status: string | null
          start_date: string | null
          end_date: string | null
        } | null
        if (!project) return
        projectMap.set(project.id, {
          id: project.id,
          name: project.name,
          quarter_id: project.quarter_id,
          status: project.status,
          start_date: project.start_date,
          end_date: project.end_date,
          members: [],
        })
      })

      assignments?.forEach((assignment: { project_id: string; is_lead: boolean; profiles: unknown }) => {
        const project = projectMap.get(assignment.project_id)
        // Supabase infers profiles as array but it's actually a single object from JOIN
        const profile = assignment.profiles as unknown as {
          id: string
          full_name: string | null
          avatar_url: string | null
          job_title: string | null
        } | null
        if (!project || !profile) return
        project.members.push({
          id: profile.id,
          name: profile.full_name,
          avatar: profile.avatar_url,
          jobTitle: profile.job_title,
          isLead: Boolean(assignment.is_lead),
        })
      })

      return Array.from(projectMap.values())
    },
    enabled: !!profile?.id,
  })
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  )
  const [reviewTarget, setReviewTarget] = useState<{
    memberId: string
    memberName: string | null
  } | null>(null)
  const [reviewDirty, setReviewDirty] = useState(false)
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)
  const [confirmSaving, setConfirmSaving] = useState(false)
  const scoringRef = useRef<ProjectScoringClientHandle | null>(null)
  const [reviewAssignment, setReviewAssignment] = useState<{
    id: string
    role_in_project: string
    projects: {
      id: string
      name: string
      description: string | null
      start_date: string
      end_date: string
      quarter_id: string
      status: string
    }
  } | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  )
  const reviewModalOpen = Boolean(reviewTarget)

  const closeReviewModal = () => {
    setReviewTarget(null)
    setReviewAssignment(null)
    setReviewDirty(false)
  }

  const handleOpenReview = async (member: {
    id: string
    name: string | null
  }) => {
    if (!selectedProject) return
    setReviewTarget({ memberId: member.id, memberName: member.name })
    setReviewAssignment(null)
    setReviewDirty(false)
    setReviewLoading(true)
    try {
      const { data } = await supabase
        .from("project_assignments")
        .select(
          "id, role_in_project, projects!inner(id,name,description,start_date,end_date,quarter_id,status)",
        )
        .eq("project_id", selectedProject.id)
        .eq("user_id", member.id)
        .maybeSingle()

      if (data) {
        const project = data.projects as {
          id: string
          name: string
          description: string | null
          start_date: string
          end_date: string
          quarter_id: string
          status: string
        }
        setReviewAssignment({
          id: data.id,
          role_in_project: data.role_in_project || member.name || "Member",
          projects: project,
        })
      }
    } finally {
      setReviewLoading(false)
    }
  }

  return (
    <TableSection title="Team KPI">
      {loading || profileLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-8" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<RiTeamLine className="size-5" />}
          title="No lead assignments"
          description="You are not assigned as a project lead."
          placement="inner"
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow className="h-[40px] hover:bg-transparent">
                <TableHead>Project</TableHead>
                <TableHead>Quarter</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Team</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => {
                const startDate = project.start_date
                  ? new Date(project.start_date)
                  : null
                const endDate = project.end_date
                  ? new Date(project.end_date)
                  : null
                const timeline =
                  startDate && endDate && isValid(startDate) && isValid(endDate)
                    ? `${format(startDate, "MMM d, yyyy")} – ${format(
                      endDate,
                      "MMM d, yyyy",
                    )}`
                    : "-"

                const members = project.members.filter((m) => !m.isLead)
                const visibleMembers = members.slice(0, 3)
                const remainingCount = members.length - visibleMembers.length
                const isSelected = project.id === selectedProjectId

                return (
                  <TableRow
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={cn(
                      "group cursor-pointer transition-colors",
                      isSelected
                        ? "bg-accent"
                        : "hover:bg-accent",
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-foreground font-medium max-w-[320px] truncate"
                          title={project.name}
                        >
                          {project.name}
                        </span>
                        {project.status && (
                          <Badge
                            variant={getProjectStatusVariant(project.status)}
                          >
                            {project.status}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.quarter_id ? (
                        <Badge variant="info">{project.quarter_id}</Badge>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-body-sm text-muted-foreground whitespace-nowrap">
                        {timeline}
                      </span>
                    </TableCell>
                    <TableCell>
                      {members.length === 0 ? (
                        <span className="text-muted-foreground/50">No team</span>
                      ) : (
                        <AvatarGroup>
                          {visibleMembers.map((member) => (
                            <Tooltip key={member.id}>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/performance/employee/${member.id}`}
                                  className="block"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <Avatar className="size-5">
                                    <AvatarImage src={member.avatar || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {member.name?.[0] || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {member.name || "-"}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                          {remainingCount > 0 && (
                            <AvatarOverflow size="xs" count={remainingCount} />
                          )}
                        </AvatarGroup>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <Sheet
            open={Boolean(selectedProject)}
            onOpenChange={(open) => {
              if (!open) setSelectedProjectId(null)
            }}
          >
            <SheetContent
              side="right"
              showCloseButton={false}
              className="flex flex-col gap-0 overflow-y-auto bg-card p-0 data-[side=right]:w-full sm:data-[side=right]:inset-y-6 sm:data-[side=right]:right-6 sm:data-[side=right]:h-auto sm:data-[side=right]:w-[560px] sm:data-[side=right]:max-w-[560px] sm:rounded-xl sm:border sm:border-border sm:shadow-regular-md"
            >
              <div className="relative pl-5 pr-3 pb-2 pt-5">
                <SheetTitle className="pr-12">
                  {selectedProject?.name || "Project Detail"}
                </SheetTitle>
                <SheetClose
                  className="absolute right-[var(--padding-xl)] top-[var(--padding-xl)] inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground/70 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Close"
                >
                  <RiCloseLine className="size-[14px]" />
                </SheetClose>
              </div>
              <div className="flex-1 space-y-4 bg-card p-5">
                {selectedProject && (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-label-xs text-muted-foreground/70">
                          Quarter
                        </p>
                        {selectedProject.quarter_id ? (
                          <Badge variant="info">{selectedProject.quarter_id}</Badge>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-label-xs text-muted-foreground/70">
                          Status
                        </p>
                        {selectedProject.status ? (
                          <Badge variant="secondary">
                            {selectedProject.status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-label-xs text-muted-foreground/70">
                          Timeline
                        </p>
                        <span className="text-body-sm text-foreground text-right">
                          {(() => {
                            const startDate = selectedProject.start_date
                              ? new Date(selectedProject.start_date)
                              : null
                            const endDate = selectedProject.end_date
                              ? new Date(selectedProject.end_date)
                              : null
                            return startDate &&
                              endDate &&
                              isValid(startDate) &&
                              isValid(endDate)
                              ? `${format(startDate, "MMM d, yyyy")} – ${format(
                                endDate,
                                "MMM d, yyyy",
                              )}`
                              : "-"
                          })()}
                        </span>
                      </div>
                    </div>

                    <TableSection
                      title="Team Members"
                      titleClassName="text-label-md text-foreground"
                    >
                      {selectedProject.members.length === 0 ? (
                        <EmptyState
                          placement="inner"
                          title="No team members"
                          description="No member is assigned to this project yet."
                        />
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="h-[40px] hover:bg-transparent">
                              <TableHead className="min-w-0">
                                Member
                              </TableHead>
                              <TableHead className="w-[1%] whitespace-nowrap">
                                Role
                              </TableHead>
                              <TableHead className="w-[1%] whitespace-nowrap">
                                Action
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedProject.members.map((member) => (
                              <TableRow key={member.id}>
                                <TableCell className="min-w-0 align-top">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="size-5">
                                      <AvatarImage src={member.avatar || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {member.name?.[0] || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-foreground truncate max-w-[140px]">
                                      {member.name || "-"}
                                    </span>
                                    {member.isLead && (
                                      <Badge variant="info">
                                        Lead
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="w-[1%] whitespace-nowrap">
                                  <span className="text-muted-foreground">
                                    {member.jobTitle || "-"}
                                  </span>
                                </TableCell>
                                <TableCell className="w-[1%] whitespace-nowrap">
                                  {profile?.id === member.id ? (
                                    <span className="text-muted-foreground/50">-</span>
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenReview(member)}
                                    >
                                      Review KPI
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TableSection>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      <Dialog
        open={reviewModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (reviewDirty) {
              setConfirmCloseOpen(true)
              return
            }
            closeReviewModal()
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Review KPI {reviewTarget?.memberName || ""}
            </DialogTitle>
          </DialogHeader>
          <div>
            {reviewLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="size-8" />
              </div>
            ) : reviewAssignment ? (
              <ProjectScoringClient
                ref={scoringRef}
                employee={{
                  id: reviewTarget?.memberId || "",
                  full_name: reviewTarget?.memberName || null,
                }}
                assignment={reviewAssignment}
                hideBackButton
                onDirtyChange={setReviewDirty}
              />
            ) : (
              <EmptyState
                placement="inner"
                title="Unable to load KPI review"
                description="Assignment data is unavailable for this member."
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmCloseOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmCloseOpen(false)
            closeReviewModal()
          } else {
            setConfirmCloseOpen(true)
          }
        }}
        onConfirm={async () => {
          setConfirmSaving(true)
          await scoringRef.current?.saveAll()
          setConfirmSaving(false)
          closeReviewModal()
        }}
        title="Unsaved changes"
        description="You have unsaved changes. Do you want to save before closing?"
        confirmText="Save"
        cancelText="Don't Save"
        loading={confirmSaving}
      />
    </TableSection>
  )
}
