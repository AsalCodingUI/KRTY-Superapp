"use client"

import { EmptyState } from "@/components/empty-state"
import { ProjectAvatar } from "@/components/project-avatar"
import { sheetFillClassName } from "@/components/split-pane"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { RiExternalLinkLine, RiInboxLine } from "@/shared/ui/lucide-icons"
import { useEffect, useRef, useState } from "react"
import { hideLeads, inApp, showLead } from "../lib/desktop"
import { hostOf, useLeadSites } from "../model/data"

/** Overlays that open over the sheet: the native view would cover them,
 *  so it steps aside while one is open. */
const OVERLAYS = [
  '[data-slot="dialog-content"]',
  '[data-slot="sheet-content"]',
  '[data-slot="popover-content"]',
  '[data-slot="dropdown-menu-content"]',
  '[data-slot="select-content"]',
  "[data-ctxmenu-popup]",
  '[role="menu"]',
].join(",")

/**
 * One Leads site. In Kretya Flow the page sheet is left empty and the app
 * lays the site's own web view exactly over it (signed in, kept loaded
 * between visits); the view follows the sheet as it resizes and steps
 * aside for dialogs and menus. In a browser these sites refuse to be
 * framed, so the page offers to open it in a new tab.
 */
export function LeadViewer({ id }: { id: string }) {
  const t = useT("leads")
  const { profile } = useUserProfile()
  const { data: sites, isLoading, isError } = useLeadSites(profile?.id)
  const site = sites?.find((s) => s.id === id)
  const area = useRef<HTMLDivElement>(null)
  // null: not tried yet; false: a browser, or an app build without Leads.
  const [native, setNative] = useState<boolean | null>(null)

  useEffect(() => {
    if (!site) return
    if (!inApp()) {
      setNative(false)
      return
    }
    const el = area.current
    if (!el) return
    let frame = 0
    let covered = false
    const place = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(async () => {
        if (covered) return
        const r = el.getBoundingClientRect()
        setNative(
          await showLead(site.id, site.url, {
            x: r.left,
            y: r.top,
            width: r.width,
            height: r.height,
          }),
        )
      })
    }
    const sizes = new ResizeObserver(place)
    sizes.observe(el)
    window.addEventListener("resize", place)
    let check = 0
    const overlays = new MutationObserver(() => {
      cancelAnimationFrame(check)
      check = requestAnimationFrame(() => {
        const over = Boolean(document.querySelector(OVERLAYS))
        if (over === covered) return
        covered = over
        if (over) void hideLeads()
        else place()
      })
    })
    overlays.observe(document.body, { childList: true, subtree: true })
    place()
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(check)
      sizes.disconnect()
      overlays.disconnect()
      window.removeEventListener("resize", place)
      void hideLeads()
    }
  }, [site])

  if (isLoading || (!site && !isError && !sites))
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  if (!site)
    return (
      <EmptyState
        icon={<RiInboxLine className="size-5" />}
        title={isError ? t("loadFailed") : t("notFound")}
      />
    )

  return (
    // The sheet, edge to edge: the app's web view lies over exactly this.
    <div
      ref={area}
      data-sheet-fill=""
      className={cn(sheetFillClassName, "relative flex min-h-[520px]")}
    >
      {native === false ? (
        // A browser: the site opens in a tab of its own.
        <div className="m-auto flex max-w-sm flex-col items-center gap-4 p-6 text-center">
          <ProjectAvatar
            id={site.id}
            name={site.name}
            className="size-12 rounded-xl text-base"
          />
          <div className="flex flex-col gap-1">
            <h1 className="text-sm font-medium">{t("webTitle")}</h1>
            <p className="text-muted-foreground text-meta">
              {t("webDesc", { name: site.name })}
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<a href={site.url} target="_blank" rel="noreferrer" />}
          >
            <RiExternalLinkLine data-icon="inline-start" />
            {t("webOpen", { name: site.name })}
          </Button>
          <span className="text-tertiary-foreground text-meta">
            {hostOf(site.url)}
          </span>
        </div>
      ) : (
        // Under the web view while it loads (or for a moment as it moves).
        <div className="m-auto">
          <Spinner className="text-muted-foreground size-5" />
        </div>
      )}
    </div>
  )
}
