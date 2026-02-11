"use client"

import { createClient } from "@/shared/api/supabase/client"
import {
  Avatar,
  AvatarGroup,
  AvatarOverflow,
  Badge,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSection,
  Tooltip,
} from "@/shared/ui"
import { RiTeamLine } from "@/shared/ui/lucide-icons"
import { format, isValid } from "date-fns"
import Link from "next/link"
import { useMemo } from "react"
import useSWR from "swr"

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

export function LeadReviewTab() {
  const supabase = useMemo(() => createClient(), [])
  const { data: projects = [], isLoading: loading } = useSWR(
    "lead-projects",
    async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return []

      const { data: leadAssignments, error: leadError } = await supabase
        .from("project_assignments")
        .select(
          "project_id, projects(id,name,quarter_id,status,start_date,end_date)",
        )
        .eq("user_id", user.id)
        .eq("is_lead", true)

      let primaryAssignments = leadAssignments
      if (leadError || !leadAssignments || leadAssignments.length === 0) {
        const { data: roleAssignments, error: roleError } = await supabase
          .from("project_assignments")
          .select(
            "project_id, projects(id,name,quarter_id,status,start_date,end_date)",
          )
          .eq("user_id", user.id)
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
    { revalidateOnFocus: false },
  )

  return (
    <TableSection title="Team KPI">
      {loading ? (
        <div className="text-body-sm text-foreground-secondary p-8 text-center">
          Loading lead projects...
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<RiTeamLine />}
          title="No lead assignments"
          description="You haven't been assigned as a lead for any project yet."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Project</TableHeaderCell>
              <TableHeaderCell>Quarter</TableHeaderCell>
              <TableHeaderCell>Timeline</TableHeaderCell>
              <TableHeaderCell>Team</TableHeaderCell>
            </TableRow>
          </TableHead>
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

              return (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-foreground-primary font-medium max-w-[240px] truncate"
                        title={project.name}
                      >
                        {project.name}
                      </span>
                      {project.status && (
                        <Badge size="sm" variant="zinc">
                          {project.status}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.quarter_id ? (
                      <Badge variant="info">{project.quarter_id}</Badge>
                    ) : (
                      <span className="text-foreground-disable">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground-primary whitespace-nowrap">
                      {timeline}
                    </span>
                  </TableCell>
                  <TableCell>
                    {members.length === 0 ? (
                      <span className="text-foreground-disable">No team</span>
                    ) : (
                      <AvatarGroup>
                        {visibleMembers.map((member) => (
                          <Tooltip
                            key={member.id}
                            content={member.name || "-"}
                            side="top"
                            triggerAsChild
                          >
                            <Link
                              href={`/performance/employee/${member.id}`}
                              className="block"
                            >
                              <Avatar
                                size="xs"
                                src={member.avatar || undefined}
                                initials={member.name?.[0] || "?"}
                              />
                            </Link>
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
      )}
    </TableSection>
  )
}
