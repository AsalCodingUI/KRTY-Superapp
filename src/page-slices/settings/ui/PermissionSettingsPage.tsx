"use client"

import { siteConfig } from "@/app/siteConfig"
import { createClient } from "@/shared/api/supabase/client"
import { navigationConfig } from "@/shared/config/navigation"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { Database } from "@/shared/types/database.types"
import {
  Avatar,
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@/shared/ui"
import { EmptyState } from "@/shared/ui/information/EmptyState"
import { RiLockLine, RiSettings3Line } from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type UserPagePermission =
  Database["public"]["Tables"]["user_page_permissions"]["Row"]

const ROLES = ["stakeholder", "employee"]
const JOB_TITLES = ["Admin", "Project Manager", "Designer", "Web Developer"]

/** Pages controllable from app navigation (no hardcoded page list) */
const CONTROLLABLE_PAGES = (() => {
  const sourceItems = [
    ...navigationConfig.main,
    ...navigationConfig.footer,
    { name: "Settings General", href: siteConfig.baseLinks.settings.general },
    {
      name: "Settings Permission",
      href: siteConfig.baseLinks.settings.permission,
    },
  ]

  const unique = new Map<string, { label: string; slug: string }>()

  for (const item of sourceItems) {
    if (!item.href.startsWith("/")) continue
    if (!unique.has(item.href)) {
      unique.set(item.href, { label: item.name, slug: item.href })
    }
  }

  return Array.from(unique.values())
})()

type PagePermissionsMap = Record<string, boolean>

export default function PermissionSettingsPage({
  initialData,
  initialPermissions,
}: {
  initialData: Profile[]
  initialPermissions: UserPagePermission[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const {
    isSuperAdmin,
    profile: effectiveProfile,
    authProfile,
    isImpersonating,
    loading: profileLoading,
    refreshProfile,
  } = useUserProfile()

  const [profiles, setProfiles] = useState(initialData)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadingImpersonationId, setLoadingImpersonationId] = useState<string | null>(null)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [loadingPermissionKey, setLoadingPermissionKey] = useState<
    string | null
  >(null)

  // Build a map: userId → { pageSlug → granted }
  const [permissionsMap, setPermissionsMap] = useState<
    Record<string, PagePermissionsMap>
  >(() => {
    const map: Record<string, PagePermissionsMap> = {}
    for (const perm of initialPermissions) {
      if (!map[perm.user_id]) map[perm.user_id] = {}
      map[perm.user_id][perm.page_slug] = perm.granted
    }
    return map
  })

  // ── Update role/job_title ──────────────────────────────────────────────────
  const handleUpdate = async (
    id: string,
    field: "role" | "job_title",
    value: string,
  ) => {
    setLoadingId(id)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("id", id)

      if (error) throw error

      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
      )
      router.refresh()
    } catch (error) {
      console.error("Gagal update:", error)
      toast.error("Gagal mengupdate data.")
    } finally {
      setLoadingId(null)
    }
  }

  // ── Toggle super_admin ────────────────────────────────────────────────────
  const handleSuperAdminToggle = async (id: string, current: boolean) => {
    setLoadingId(id)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_super_admin: !current })
        .eq("id", id)

      if (error) throw error

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, is_super_admin: !current } : p,
        ),
      )
    } catch (error) {
      console.error("Gagal toggle super admin:", error)
    } finally {
      setLoadingId(null)
    }
  }

  // ── Toggle page permission ────────────────────────────────────────────────
  const handlePagePermissionToggle = async (
    userId: string,
    pageSlug: string,
    currentGranted: boolean | undefined,
  ) => {
    const permissionKey = `${userId}:${pageSlug}`
    const newGranted = !currentGranted
    setLoadingPermissionKey(permissionKey)

    // Optimistic update
    setPermissionsMap((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [pageSlug]: newGranted,
      },
    }))

    try {
      const { error } = await supabase.from("user_page_permissions").upsert(
        {
          user_id: userId,
          page_slug: pageSlug,
          granted: newGranted,
          granted_by: authProfile?.id,
        },
        { onConflict: "user_id,page_slug" },
      )
      if (error) throw error
    } catch (error) {
      console.error("Gagal update permission:", error)
      // Revert optimistic update on error
      setPermissionsMap((prev) => ({
        ...prev,
        [userId]: {
          ...(prev[userId] || {}),
          [pageSlug]: currentGranted ?? false,
        },
      }))
    } finally {
      setLoadingPermissionKey(null)
    }
  }

  const handleImpersonation = async (targetUserId: string | null) => {
    setLoadingImpersonationId(targetUserId || "stop")
    try {
      const response = await fetch("/api/admin/impersonation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || "Failed to switch user")
      }

      toast.success(
        targetUserId ? "Now viewing selected user" : "Returned to your account",
      )

      await refreshProfile()
      router.refresh()
      router.push("/leave")
    } catch (error) {
      console.error("Failed to switch user", error)
      toast.error(error instanceof Error ? error.message : "Failed to switch user")
    } finally {
      setLoadingImpersonationId(null)
    }
  }

  // ── Access Denied guard ───────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <section className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-foreground-secondary text-body-sm">
          Loading permissions...
        </p>
      </section>
    )
  }

  if (!isSuperAdmin) {
    return (
      <section className="flex flex-col items-center justify-center py-16 text-center">
        <RiLockLine className="text-foreground-secondary mb-3 size-8" />
        <h3 className="text-label-md text-foreground-primary">
          Access Restricted
        </h3>
        <p className="text-foreground-secondary text-body-sm mt-1">
          Only Super Admins can manage user permissions.
        </p>
      </section>
    )
  }

  return (
    <section aria-labelledby="permissions-title">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h3
            id="permissions-title"
            className="text-heading-md text-foreground-primary scroll-mt-10"
          >
            User Permissions
          </h3>
        </div>
      </div>

      {isImpersonating && effectiveProfile && authProfile && (
        <div className="mt-4 flex items-center justify-between rounded-md border border-neutral-primary bg-surface-warning-light px-3 py-2">
          <p className="text-body-sm text-foreground-warning-on-color">
            Viewing as <strong>{effectiveProfile.full_name || effectiveProfile.email || "User"}</strong>
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleImpersonation(null)}
            disabled={loadingImpersonationId === "stop"}
          >
            Stop
          </Button>
        </div>
      )}

      <ul role="list" className="mt-6 divide-y divide-neutral-primary">
        {profiles.map((user) => {
          const initials = user.full_name
            ? user.full_name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
            : "U"

          const isExpanded = expandedUserId === user.id
          const userPerms = permissionsMap[user.id] ?? {}
          const isCurrentUser = user.id === authProfile?.id
          const isViewingThisUser =
            isImpersonating && effectiveProfile?.id === user.id
          const impersonationBusy =
            loadingImpersonationId === user.id || loadingImpersonationId === "stop"

          return (
            <li key={user.id} className="py-3">
              {/* ── User row ── */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-x-4 overflow-hidden text-left">
                  <Avatar
                    size="sm"
                    src={user.avatar_url || undefined}
                    initials={initials}
                    alt={user.full_name || user.email || "User"}
                    color="neutral"
                    className="shrink-0"
                  />
                  <div className="truncate">
                    <p className="text-foreground-primary text-label-md flex items-center gap-1.5 truncate">
                      {user.full_name || "Unknown User"}
                      {user.is_super_admin && (
                        <Badge variant="info" size="sm">
                          Super Admin
                        </Badge>
                      )}
                    </p>
                    <p className="text-foreground-secondary text-body-xs truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Role & Job dropdowns */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {/* Super Admin Toggle (not for self) */}
                  {!isCurrentUser && (
                    <Button
                      variant={user.is_super_admin ? "secondary" : "tertiary"}
                      size="sm"
                      onClick={() =>
                        handleSuperAdminToggle(
                          user.id,
                          user.is_super_admin ?? false,
                        )
                      }
                      disabled={loadingId === user.id}
                    >
                      {user.is_super_admin
                        ? "Remove Super Admin"
                        : "Make Super Admin"}
                    </Button>
                  )}

                  {!isCurrentUser && (
                    <Button
                      variant={isViewingThisUser ? "secondary" : "tertiary"}
                      size="sm"
                      onClick={() =>
                        handleImpersonation(isViewingThisUser ? null : user.id)
                      }
                      disabled={impersonationBusy}
                    >
                      {isViewingThisUser ? "Stop View" : "View as User"}
                    </Button>
                  )}

                  {/* Job Title */}
                  <div className="w-full sm:w-40">
                    <span className="text-foreground-secondary text-body-xs mb-1 block sm:hidden">
                      Job Title
                    </span>
                    <Select
                      value={user.job_title || undefined}
                      onValueChange={(val) =>
                        handleUpdate(user.id, "job_title", val)
                      }
                      disabled={loadingId === user.id}
                    >
                      <SelectTrigger className="h-[28px]">
                        <SelectValue placeholder="Select Job" />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_TITLES.map((job) => (
                          <SelectItem key={job} value={job}>
                            {job}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Role */}
                  <div className="w-full sm:w-36">
                    <span className="text-foreground-secondary text-body-xs mb-1 block sm:hidden">
                      Role
                    </span>
                    <Select
                      value={user.role}
                      onValueChange={(val) =>
                        handleUpdate(user.id, "role", val)
                      }
                      disabled={loadingId === user.id}
                    >
                      <SelectTrigger className="h-[28px]">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent align="end">
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setExpandedUserId(isExpanded ? null : user.id)
                    }
                  >
                    <RiSettings3Line className="mr-1 size-4" />
                    {isExpanded ? "Hide Access" : "Configure Access"}
                  </Button>
                </div>
              </div>

              {/* ── Expanded page permissions ── */}
              {isExpanded && (
                <div className="py-4">
                  <p className="text-foreground-secondary text-label-xs mb-3">
                    Page Access
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {CONTROLLABLE_PAGES.map((page) => {
                      const granted = userPerms[page.slug]
                      const isGranted = granted === true
                      const isExplicit = page.slug in userPerms
                      const permissionKey = `${user.id}:${page.slug}`
                      const isSaving = loadingPermissionKey === permissionKey

                      return (
                        <div
                          key={page.slug}
                          className="border-neutral-primary bg-surface-neutral-primary flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <div className="min-w-0 pr-3">
                            <p className="text-label-xs text-foreground-primary truncate">
                              {page.label}
                            </p>
                            <p className="text-body-xs text-foreground-tertiary truncate">
                              {page.slug}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                isGranted
                                  ? "success"
                                  : isExplicit
                                    ? "error"
                                    : "default"
                              }
                            >
                              {isGranted
                                ? "Allowed"
                                : isExplicit
                                  ? "Denied"
                                  : "Not set"}
                            </Badge>
                            <Switch
                              checked={isGranted}
                              disabled={isSaving}
                              onCheckedChange={() =>
                                handlePagePermissionToggle(
                                  user.id,
                                  page.slug,
                                  isGranted,
                                )
                              }
                              aria-label={`Toggle ${page.label}`}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-foreground-tertiary text-body-xs mt-3">
                    Toggle each page directly. Allowed = on, Denied = off.
                  </p>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {profiles.length === 0 && (
        <EmptyState
          title="No users found"
          description="User accounts are not available yet."
          icon={<RiSettings3Line className="size-5" />}
        />
      )}
    </section>
  )
}
