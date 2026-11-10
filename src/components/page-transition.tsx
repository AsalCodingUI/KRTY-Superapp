"use client"

import { useWorkspaceNav } from "@/components/workspace-nav"
import { matchProjectPath } from "@/shared/config/project-sections"
import { m } from "motion/react"
import { DURATION, EASE_OUT } from "@/shared/lib/motion"
import { usePathname } from "next/navigation"
import { useState } from "react"

/** Left → right: Kantor, Project, then inside a project. */
const RANK: Record<string, number> = { personal: 0, project: 1 }
const rankOf = (key: string) =>
  key.startsWith("project:") ? 2 : (RANK[key.slice(3)] ?? 0)

/**
 * The page slides in with a soft blur when you move between workspaces or
 * into / out of a project, the same way as the sidebar's menu: forward
 * (Kantor → Project → a project) from the right, back from the left. While
 * the next page loads, the current one dims and blurs so the click shows
 * at once. Moving between pages of one workspace isn't animated.
 */
export function WorkspaceTransition({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { routeId } = useWorkspaceNav()
  const project = matchProjectPath(pathname)
  const key = project ? `project:${project.ref}` : `ws:${routeId}`

  // Direction of the last move; 0 until the first one (no intro on load).
  const [moved, setMoved] = useState({ key, dir: 0 })
  if (moved.key !== key)
    setMoved({ key, dir: rankOf(key) >= rankOf(moved.key) ? 1 : -1 })
  const dir = moved.dir

  return (
    <m.div
      key={key}
      initial={
        dir === 0 ? false : { opacity: 0, x: 28 * dir, filter: "blur(8px)" }
      }
      animate={{
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        // No filter / transform left behind: they would trap fixed and
        // sticky children.
        transitionEnd: { filter: "none" },
      }}
      transition={{ duration: DURATION.slow, ease: EASE_OUT }}
      className="flex flex-1 flex-col gap-4"
    >
      {children}
    </m.div>
  )
}
