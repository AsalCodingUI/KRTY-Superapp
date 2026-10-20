import { Database } from "@/shared/types/database.types"
import { Badge } from "@/components/ui/badge"
import { canManageByRole } from "@/shared/lib/roles"
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
        return "destructive" as const
      case "Project Manager":
        return "warning" as const
      case "Designer":
        return "success" as const
      case "Web Developer":
        return "info" as const
      default:
        return "secondary" as const
    }
  }

  const getRoleVariant = (role: string) => {
    return canManageByRole(role) ? ("success" as const) : ("secondary" as const)
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
          className="border-border flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex items-center gap-4">
            <span className="bg-muted text-muted-foreground inline-flex size-10 items-center justify-center rounded-full text-sm font-medium">
              {getInitials(member.full_name || "")}
            </span>
            <div>
              <p className="text-foreground font-medium">{member.full_name}</p>
              <p className="text-muted-foreground text-sm">{member.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <Badge variant={getJobTitleVariant(member.job_title || "")}>
                {member.job_title}
              </Badge>
              <p className="text-muted-foreground mt-1 text-sm">
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
