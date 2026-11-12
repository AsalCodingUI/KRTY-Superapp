"use client"

import { EmptyState } from "@/components/empty-state"
import { useBreadcrumbs } from "@/components/page-breadcrumbs"
import { ProjectAvatar } from "@/components/project-avatar"
import { sheetFillClassName } from "@/components/split-pane"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { RiExternalLinkLine, RiInboxLine } from "@/shared/ui/lucide-icons"
import { useEffect, useRef, useState } from "react"
import { hideLeads, inApp, showLead, snapshotLead } from "../lib/desktop"
import { hostOf, useLeadSites } from "../model/data"

/** Overlays the native view would cover (it's always on top of the
 *  page): it steps aside while one of them overlaps it. */
const OVERLAYS = [
  '[data-slot="tooltip-content"]',
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
  const { data: sites, isLoading, isError } = useLeadSites()
  const site = sites?.find((s) => s.id === id)
  // The tab is named after the site (not Kelola situs, the /leads row).
  useBreadcrumbs(site ? [{ label: site.name }] : [])
  const area = useRef<HTMLDivElement>(null)
  // null: not tried yet; false: a browser, or an app build without Leads.
  const [native, setNative] = useState<boolean | null>(null)
  // While an overlay needs the view hidden: a picture of the site in its
  // place, so it looks frozen for a moment rather than gone (loading).
  const [shot, setShot] = useState<string | null>(null)

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
        // The sheet's corner: its wrapper's radius (a squircle there, so a
        // touch less on macOS's continuous curve). The left corners round
        // too when the panel is folded (the view starts at the sheet's
        // edge then).
        const sheet = el.closest("[data-paper]")?.parentElement
        const sheetBox = sheet?.getBoundingClientRect()
        const css = sheet
          ? parseFloat(getComputedStyle(sheet).borderTopRightRadius) || 0
          : 0
        const squircle =
          typeof CSS !== "undefined" && CSS.supports("corner-shape", "squircle")
        setNative(
          await showLead(site.id, site.url, {
            x: r.left,
            y: r.top,
            width: r.width,
            height: r.height,
            radius: squircle ? css / 1.53 : css,
            roundLeft: sheetBox ? Math.abs(r.left - sheetBox.left) < 2 : false,
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
        // Only what lies over the site (a tooltip by the rail, a menu in
        // the sidebar don't).
        const box = el.getBoundingClientRect()
        const over = [...document.querySelectorAll(OVERLAYS)].some((node) => {
          const o = node.getBoundingClientRect()
          return (
            o.width > 0 &&
            o.right > box.left &&
            o.left < box.right &&
            o.bottom > box.top &&
            o.top < box.bottom
          )
        })
        if (over === covered) return
        covered = over
        if (over) {
          // The picture first, then the view out of the way.
          void snapshotLead(site.id).then((url) => {
            if (url) setShot(url)
            if (covered) void hideLeads()
          })
        } else {
          place()
          // The view is back on top; drop the picture once it has painted.
          window.setTimeout(() => setShot(null), 120)
        }
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
      setShot(null)
    }
  }, [site])

  // The picture's object URL is let go once it's replaced or dropped.
  useEffect(
    () => () => {
      if (shot) URL.revokeObjectURL(shot)
    },
    [shot],
  )

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
        <>
          {/* Under the web view while it loads (or for a moment as it
              moves). */}
          <div className="m-auto">
            <Spinner className="text-muted-foreground size-5" />
          </div>
          {shot && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shot}
              alt=""
              aria-hidden
              className="absolute inset-0 size-full object-cover object-left-top"
            />
          )}
        </>
      )}
    </div>
  )
}
