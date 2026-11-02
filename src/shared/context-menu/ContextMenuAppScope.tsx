"use client"

import { useDesktopShell } from "@/components/desktop-shell"
import { accessLevel } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useEffect } from "react"
import { useSetContextMenuScope } from "./ContextMenuProvider"

/**
 * In the signed-in app layout: tells the menu who is looking (access
 * level, for `access` on items), that ⌘K search is there, and
 * whether it runs in KRTY for Mac. Without it (client report, portal) the
 * menu keeps to the generic, signed-out items.
 */
export function ContextMenuAppScope() {
  const { profile } = useUserProfile()
  const desktop = useDesktopShell()
  const setScope = useSetContextMenuScope()
  const level = profile ? accessLevel(profile) : null
  useEffect(() => {
    setScope({
      access: level,
      desktop,
      search: true,
    })
    return () => setScope(null)
  }, [setScope, level, desktop])
  return null
}
