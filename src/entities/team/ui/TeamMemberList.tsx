import { Database } from "@/shared/types/database.types"
import { Badge } from "@/shared/ui"
;("use client")

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface TeamMemberListProps {
  members: Profile[]
  onEdit?: (member: Profile) => void
  onDelete?: (memberId: string) => void
}

/**
 * TeamMemberList - Displays a list of team members
 *
 * Shows member details including name, job title, role, and hourly rate.
 * Supports optional edit and delete actions.
 */
export function TeamMemberList({
  members,
  onEdit: _onEdit,
  onDelete: _onDelete,
}: TeamMemberListProps) {
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getJobTitleVariant = (title: string) => {
    switch (title) {
      case "Admin":
        return "error"
      case "Project Manager":
        return "warning"
      case "Designer":
        return "success"
      case "Web Developer":
        return "default"
      default:
        return "zinc"
    }
  }

  const getRoleVariant = (role: string) => {
    return role === "stakeholder" ? "success" : "zinc"
  }

  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "U"
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div
          key={member.id}
          className="border-border bg-surface flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex items-center gap-4">
            <span className="bg-muted text-label-md text-content-subtle inline-flex size-10 items-center justify-center rounded-full">
              {getInitials(member.full_name || "")}
            </span>
            <div>
              <p className="text-content font-medium">{member.full_name}</p>
              <p className="text-body-sm text-content-subtle">{member.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <Badge variant={getJobTitleVariant(member.job_title || "")}>
                {member.job_title}
              </Badge>
              <p className="text-body-sm text-content-subtle mt-1">
                {formatRupiah(member.hourly_rate || 0)}/hr
              </p>
            </div>
            <Badge variant={getRoleVariant(member.role || "employee")}>
              {member.role?.charAt(0).toUpperCase()}
              {member.role?.slice(1)}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
