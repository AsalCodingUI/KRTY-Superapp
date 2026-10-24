"use client"

import * as React from "react"

import { useNavBadges } from "@/components/use-nav-badges"
import {
  matchesRoute,
  resolveWorkspace,
  workspaces,
  type Workspace,
  type WorkspaceId,
  type WorkspaceItem,
  type WorkspaceProfile,
} from "@/shared/config/workspaces"
import { usePagePermissions } from "@/shared/hooks/usePagePermissions"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { usePathname, useRouter } from "next/navigation"

type PermissionMap = Record<string, boolean> | null

/** Same rule as middleware: the longest granted/denied slug prefix decides. */
function canOpen(href: string, permissions: PermissionMap) {
  // Readable by everyone; not part of page access settings.
  if (
    href === "/notifications" ||
    href === "/policies" ||
    href === "/clients" ||
    href === "/processes" ||
    href === "/payment-methods"
  )
    return true
  if (!permissions) return false
  const slug = Object.keys(permissions)
    .filter((s) => matchesRoute(href, s))
    .sort((a, b) => b.length - a.length)[0]
  return slug ? permissions[slug] === true : false
}

type VisibleWorkspace = Omit<Workspace, "items"> & { items: WorkspaceItem[] }

type WorkspaceNav = {
  loading: boolean
  visible: VisibleWorkspace[]
  active: VisibleWorkspace | undefined
  /** The workspace the current route belongs to (lags `active` on switch). */
  routeId: WorkspaceId
  /** Switched, and the new workspace's page is still loading. */
  pending: boolean
  /** Switch workspace: opens its first page (e.g. Project → /projects). */
  select: (id: WorkspaceId) => void
  badges: Record<string, number>
  hasBadge: (ws: VisibleWorkspace) => boolean
}

const WorkspaceNavContext = React.createContext<WorkspaceNav | null>(null)

/**
 * Workspaces the viewer can open, and which one the sidebar lists. Shared by
 * the top bar (switch) and the sidebar (its pages).
 */
export function WorkspaceNavProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { profile, loading: profileLoading } = useUserProfile()
  const { permissions, loading: permLoading } = usePagePermissions()

  const visible = React.useMemo<VisibleWorkspace[]>(() => {
    if (!profile) return []
    const p = profile as WorkspaceProfile
    return workspaces
      .filter((ws) => !ws.can || ws.can(p))
      .map((ws) => ({
        ...ws,
        items: ws
          .items(p)
          .filter(
            (item) =>
              (!item.can || item.can(p)) &&
              canOpen(item.href, permissions as PermissionMap),
          ),
      }))
      .filter((ws) => ws.items.length > 0)
  }, [profile, permissions])

  const routeWorkspace = resolveWorkspace(pathname, visible)
  const [selected, setSelected] = React.useState<WorkspaceId | null>(null)
  React.useEffect(() => setSelected(null), [routeWorkspace])
  const activeId = selected ?? routeWorkspace
  const active = visible.find((ws) => ws.id === activeId) ?? visible[0]

  // Switching lands on the workspace's first page, wherever you were (a
  // project's tab, a personal page…), so the page never stays behind. The
  // sidebar switches right away; the route follows.
  const router = useRouter()
  const select = React.useCallback(
    (id: WorkspaceId) => {
      if (id === active?.id) return
      setSelected(id)
      const first = visible.find((ws) => ws.id === id)?.items[0]?.href
      if (first) router.push(first)
    },
    [active?.id, visible, router],
  )
  // Warm each workspace's landing page so a switch doesn't wait on it.
  React.useEffect(() => {
    for (const ws of visible) {
      const first = ws.items[0]?.href
      if (first) router.prefetch(first)
    }
  }, [visible, router])
  const pending = selected !== null && selected !== routeWorkspace

  const badges = useNavBadges(
    profile ? { id: profile.id, role: profile.role } : null,
  )
  const hasBadge = React.useCallback(
    (ws: VisibleWorkspace) =>
      ws.items.some(
        (item) =>
          (badges[item.href] ?? 0) > 0 ||
          (item.children ?? []).some((c) => (badges[c.href] ?? 0) > 0),
      ),
    [badges],
  )

  const value = React.useMemo<WorkspaceNav>(
    () => ({
      loading: profileLoading || permLoading,
      visible,
      active,
      routeId: routeWorkspace,
      pending,
      select,
      badges,
      hasBadge,
    }),
    [
      profileLoading,
      permLoading,
      visible,
      active,
      routeWorkspace,
      pending,
      select,
      badges,
      hasBadge,
    ],
  )

  return (
    <WorkspaceNavContext.Provider value={value}>
      {children}
    </WorkspaceNavContext.Provider>
  )
}

export function useWorkspaceNav() {
  const ctx = React.useContext(WorkspaceNavContext)
  if (!ctx)
    throw new Error("useWorkspaceNav must be used within WorkspaceNavProvider")
  return ctx
}
