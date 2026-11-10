"use client"

import * as React from "react"

import { useNavBadges } from "@/components/use-nav-badges"
import {
  resolveWorkspace,
  workspaces,
  type Workspace,
  type WorkspaceId,
  type WorkspaceItem,
  type WorkspaceProfile,
} from "@/shared/config/workspaces"
import { accessLevel, canOpenPage } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { usePathname } from "next/navigation"

type VisibleWorkspace = Omit<Workspace, "items"> & { items: WorkspaceItem[] }

type WorkspaceNav = {
  loading: boolean
  visible: VisibleWorkspace[]
  active: VisibleWorkspace | undefined
  /** The workspace the current route belongs to (lags `active` on switch). */
  routeId: WorkspaceId
  /** Switch workspace: swaps the sidebar's list; the page stays. */
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

  const visible = React.useMemo<VisibleWorkspace[]>(() => {
    if (!profile) return []
    const p = profile as WorkspaceProfile
    const level = accessLevel(p)
    return workspaces
      .filter((ws) => !ws.can || ws.can(p))
      .map((ws) => ({
        ...ws,
        items: ws
          .items(p)
          .filter(
            (item) =>
              (!item.can || item.can(p)) && canOpenPage(item.href, level),
          ),
      }))
      .filter((ws) => ws.items.length > 0)
  }, [profile])

  // A global page (Beranda, Kalender, Tugas saya) belongs to no workspace:
  // the sidebar keeps the one it showed.
  const routeMatch = resolveWorkspace(pathname, visible)
  const [lastRoute, setLastRoute] = React.useState<WorkspaceId>(
    routeMatch ?? "personal",
  )
  if (routeMatch && routeMatch !== lastRoute) setLastRoute(routeMatch)
  const routeWorkspace = routeMatch ?? lastRoute
  // A tab picked by hand holds until the route moves to another workspace.
  const [selected, setSelected] = React.useState<WorkspaceId | null>(null)
  const [selectedAt, setSelectedAt] = React.useState(routeWorkspace)
  if (selectedAt !== routeWorkspace) {
    setSelectedAt(routeWorkspace)
    setSelected(null)
  }
  const activeId = selected ?? routeWorkspace
  const active = visible.find((ws) => ws.id === activeId) ?? visible[0]

  // Switching only swaps the list, like Fibery's Workspace | Personal: the
  // page stays (Beranda and the rest of the top block are always there).
  const select = React.useCallback(
    (id: WorkspaceId) => {
      if (id !== active?.id) setSelected(id)
    },
    [active?.id],
  )
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
      loading: profileLoading,
      visible,
      active,
      routeId: routeWorkspace,
      select,
      badges,
      hasBadge,
    }),
    [profileLoading, visible, active, routeWorkspace, select, badges, hasBadge],
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
