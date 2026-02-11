import type { Database } from "@/shared/types"

export type UserRole = Database["public"]["Enums"]["app_role"]

const ADMIN_ROLES = new Set<UserRole>(["stakeholder"])

export function isAdminRole(role?: string | null) {
  if (!role) return false
  return ADMIN_ROLES.has(role as UserRole)
}

export function isEmployeeRole(role?: string | null) {
  return role === "employee"
}

type RoleCheckOptions = {
  allowUnknown?: boolean
}

export function canManageByRole(
  role?: string | null,
  options: RoleCheckOptions = {},
) {
  if (!role) return options.allowUnknown ?? false
  return isAdminRole(role)
}

export function hasRoleAccess(
  requiredRoles: readonly string[],
  role?: string | null,
  options: RoleCheckOptions = {},
) {
  if (!role) return options.allowUnknown ?? false
  return requiredRoles.includes(role)
}

type ProfileLike = {
  role?: string | null
  job_title?: string | null
}

export function canAccessProjectCalculator(
  profile?: ProfileLike | null,
  options: RoleCheckOptions = {},
) {
  if (!profile) return options.allowUnknown ?? false
  return canManageByRole(profile.role) || profile.job_title === "Project Manager"
}

export function canAccessSLAGenerator(
  profile?: ProfileLike | null,
  options: RoleCheckOptions = {},
) {
  if (!profile) return options.allowUnknown ?? false
  return (
    canManageByRole(profile.role) ||
    profile.job_title === "Project Manager" ||
    profile.job_title === "Admin"
  )
}
