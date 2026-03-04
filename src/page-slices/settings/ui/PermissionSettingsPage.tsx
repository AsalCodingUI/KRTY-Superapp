"use client"

import { siteConfig } from "@/app/siteConfig"
import { createClient } from "@/shared/api/supabase/client"
import { navigationConfig } from "@/shared/config/navigation"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { Database } from "@/shared/types/database.types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui"
import { EmptyState } from "@/shared/ui/information/EmptyState"
import { RiLockLine, RiVerifiedBadgeFill } from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"
import { useState } from "react"

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
    profile: currentUser,
    loading: profileLoading,
  } = useUserProfile()

  const [profiles, setProfiles] = useState(initialData)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

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
      alert("Gagal mengupdate data. Cek console.")
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
    const newGranted = !currentGranted

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
          granted_by: currentUser?.id,
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
        <h3 className="text-foreground-primary font-semibold">
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
            className="text-foreground-primary scroll-mt-10 font-semibold"
          >
            User Permissions
          </h3>
          <p className="text-foreground-secondary text-label-md">
            Manage roles, job titles, and per-page access for your team members.
          </p>
        </div>
      </div>

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
          const isCurrentUser = user.id === currentUser?.id

          return (
            <li key={user.id} className="py-4">
              {/* ── User row ── */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Info + expand toggle */}
                <button
                  type="button"
                  className="flex items-center gap-x-4 overflow-hidden text-left"
                  onClick={() =>
                    setExpandedUserId(isExpanded ? null : user.id)
                  }
                >
                  <span
                    className="border-neutral-primary bg-surface-neutral-secondary text-foreground-secondary text-label-xs relative hidden size-10 shrink-0 items-center justify-center rounded-full border sm:flex"
                    aria-hidden="true"
                  >
                    {initials}
                    {user.is_super_admin && (
                      <RiVerifiedBadgeFill className="absolute -right-1 -top-1 size-4 text-blue-500" />
                    )}
                  </span>
                  <div className="truncate">
                    <p className="text-foreground-primary text-label-md flex items-center gap-1.5 truncate">
                      {user.full_name || "Unknown User"}
                      {user.is_super_admin && (
                        <span className="text-label-xs rounded-full bg-blue-500/10 px-1.5 py-0.5 text-blue-500">
                          Super Admin
                        </span>
                      )}
                    </p>
                    <p className="text-foreground-secondary text-body-xs truncate">
                      {user.email}
                    </p>
                  </div>
                </button>

                {/* Role & Job dropdowns */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {/* Super Admin Toggle (not for self) */}
                  {!isCurrentUser && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSuperAdminToggle(
                          user.id,
                          user.is_super_admin ?? false,
                        )
                      }
                      disabled={loadingId === user.id}
                      className={`text-label-xs rounded-full border px-2.5 py-1 transition-colors ${user.is_super_admin
                        ? "border-blue-400 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                        : "border-neutral-primary text-foreground-secondary hover:border-blue-400 hover:text-blue-500"
                        }`}
                    >
                      {user.is_super_admin
                        ? "Remove Super Admin"
                        : "Make Super Admin"}
                    </button>
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
                      <SelectTrigger className="h-8">
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
                      <SelectTrigger className="h-8">
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
                </div>
              </div>

              {/* ── Expanded page permissions ── */}
              {isExpanded && (
                <div className="border-neutral-primary mt-4 rounded-lg border p-4">
                  <p className="text-foreground-secondary text-label-xs mb-3 uppercase tracking-wide">
                    Page Access
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                    {CONTROLLABLE_PAGES.map((page) => {
                      const granted = userPerms[page.slug]
                      const isGranted = granted === true
                      const isExplicit = page.slug in userPerms

                      return (
                        <button
                          key={page.slug}
                          type="button"
                          onClick={() =>
                            handlePagePermissionToggle(
                              user.id,
                              page.slug,
                              isGranted,
                            )
                          }
                          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors ${isGranted
                            ? "border-green-500/40 bg-green-500/10 text-green-600"
                            : isExplicit
                              ? "border-red-400/40 bg-red-500/10 text-red-500"
                              : "border-neutral-primary text-foreground-secondary hover:border-neutral-secondary"
                            }`}
                        >
                          <span
                            className={`size-2 shrink-0 rounded-full ${isGranted
                              ? "bg-green-500"
                              : isExplicit
                                ? "bg-red-400"
                                : "bg-neutral-400"
                              }`}
                          />
                          <span className="text-label-xs">{page.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-foreground-tertiary text-body-xs mt-3">
                    Click a page to toggle access. Green = granted, Red =
                    denied, Grey = role default.
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
          description="User accounts will appear here once they are created"
          icon={null}
          variant="compact"
        />
      )}
    </section>
  )
}
