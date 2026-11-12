"use client"

import { EmptyState } from "@/components/empty-state"
import { useBreadcrumbs } from "@/components/page-breadcrumbs"
import { ProjectAvatar } from "@/components/project-avatar"
import { sheetFillClassName } from "@/components/split-pane"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowLeft, ArrowRight, RotateCw, X } from "@/components/icons"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { RiExternalLinkLine, RiInboxLine } from "@/shared/ui/lucide-icons"
import { useEffect, useRef, useState } from "react"
import {
  focusLead,
  hideLeads,
  inApp,
  leadState,
  type LeadState,
  navLead,
  showLead,
  snapshotLead,
} from "../lib/desktop"
import { hostOf, useLeadSites } from "../model/data"

/** Small overlays the native view would cover (it's always on top of the
 *  page): it steps aside while one of them overlaps it, a picture of the
 *  site in its place. */
const OVERLAYS = [
  '[data-slot="tooltip-content"]',
  '[data-slot="popover-content"]',
  '[data-slot="dropdown-menu-content"]',
  '[data-slot="select-content"]',
  "[data-ctxmenu-popup]",
  '[role="menu"]',
  "[data-sonner-toast]",
].join(",")

/** Modals (⌘K, settings, confirms, the lightbox, any backdrop): the view
 *  goes at once and no picture stays under them (WebKit didn't blur it
 *  behind ⌘K's glass, and the site kept clicks until the picture came). */
const MODALS = [
  '[role="dialog"][aria-modal="true"]',
  '[data-slot="dialog-content"]',
  '[role="alertdialog"]',
  '[data-slot="dialog-overlay"]',
  '[data-slot="alert-dialog-overlay"]',
  '[data-slot="sheet-content"][data-side="bottom"]',
  '[data-slot="sheet-content"][data-side="top"]',
].join(",")

/** Side panels (notifications, right sheets, the docked panel): the site
 *  makes room beside them instead of stepping aside, still live (as a
 *  browser pane sits beside the chat in Claude's or ChatGPT's app). */
const SIDES = [
  '[data-slot="sheet-content"][data-side="left"]',
  '[data-slot="sheet-content"][data-side="right"]',
  '[data-slot="side-panel"]',
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
    let covered: false | "small" | "modal" = false
    // The room side panels take from the site's left and right (px).
    let carve = { left: 0, right: 0 }
    const place = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(async () => {
        if (covered) return
        const area = el.getBoundingClientRect()
        const r = {
          left: area.left + carve.left,
          top: area.top,
          width: Math.max(1, area.width - carve.left - carve.right),
          height: area.height,
        }
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
            roundLeft:
              carve.left > 0 ||
              (sheetBox ? Math.abs(r.left - sheetBox.left) < 2 : false),
          }),
        )
      })
    }
    const sizes = new ResizeObserver(place)
    sizes.observe(el)
    window.addEventListener("resize", place)
    let check = 0
    const recheck = () => {
      cancelAnimationFrame(check)
      check = requestAnimationFrame(() => {
        // A modal anywhere: the view goes now, no picture.
        if (document.querySelector(MODALS)) {
          if (covered !== "modal") {
            covered = "modal"
            setShot(null)
            void hideLeads()
          }
          return
        }
        // Only what lies over the site (a tooltip by the rail, a menu in
        // the sidebar don't).
        const box = el.getBoundingClientRect()
        // Side panels over it: the site makes room beside them (a gap of
        // 8px), unless that leaves it too narrow to use.
        const room = { left: 0, right: 0 }
        for (const node of document.querySelectorAll(SIDES)) {
          const o = node.getBoundingClientRect()
          if (o.width === 0 || o.right <= box.left || o.left >= box.right) continue
          if (o.left - box.left < box.right - o.right)
            room.left = Math.max(room.left, o.right + 8 - box.left)
          else room.right = Math.max(room.right, box.right - o.left + 8)
        }
        if (box.width - room.left - room.right < 240) {
          room.left = 0
          room.right = 0
        }
        if (room.left !== carve.left || room.right !== carve.right) {
          carve = room
          place()
        }
        const left = box.left + carve.left
        const right = box.right - carve.right
        const over = [...document.querySelectorAll(OVERLAYS)].some((node) => {
          const o = node.getBoundingClientRect()
          return (
            o.width > 0 &&
            o.right > left &&
            o.left < right &&
            o.bottom > box.top &&
            o.top < box.bottom
          )
        })
        const next = over ? "small" : false
        if (next === covered) return
        covered = next
        if (over) {
          // The picture first, then the view out of the way.
          void snapshotLead(site.id).then((url) => {
            // Closed again before the picture came: drop it.
            if (covered !== "small") {
              if (url) URL.revokeObjectURL(url)
              return
            }
            if (url) setShot(url)
            void hideLeads()
          })
        } else {
          place()
          // The view is back on top; drop the picture once it has painted.
          window.setTimeout(() => setShot(null), 120)
        }
      })
    }
    const overlays = new MutationObserver(recheck)
    // Opened, closed or moved (popovers reposition through style).
    overlays.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-open", "data-closed", "style"],
    })
    // Back from a hidden window (closed to the menu bar, another Space).
    const back = () => {
      if (document.visibilityState === "visible") place()
    }
    window.addEventListener("focus", place)
    document.addEventListener("visibilitychange", back)
    // The page holding the window's focus still gets the mouse moves over
    // the site (AppKit sends them to the focused view), and the site no
    // hover: hand the focus over as soon as the mouse is on the site.
    let handed = 0
    const onMove = (e: MouseEvent) => {
      if (covered) return
      const box = el.getBoundingClientRect()
      const left = box.left + carve.left
      const right = box.right - carve.right
      if (
        e.clientX >= left &&
        e.clientX <= right &&
        e.clientY >= box.top &&
        e.clientY <= box.bottom &&
        performance.now() - handed > 300
      ) {
        handed = performance.now()
        void focusLead(site.id)
      }
    }
    document.addEventListener("mousemove", onMove)
    place()
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(check)
      sizes.disconnect()
      overlays.disconnect()
      window.removeEventListener("resize", place)
      window.removeEventListener("focus", place)
      document.removeEventListener("visibilitychange", back)
      document.removeEventListener("mousemove", onMove)
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

  if (native === false)
    return (
      // A browser: the site opens in a tab of its own.
      <div
        data-sheet-fill=""
        className={cn(sheetFillClassName, "relative flex min-h-[520px]")}
      >
        <div className="m-auto flex max-w-sm flex-col items-center gap-4 p-6 text-center">
          <ProjectAvatar id={site.id} name={site.name} className="size-12" />
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium">{t("webTitle")}</h2>
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
      </div>
    )

  return (
    // The sheet, edge to edge: a browser pane (Claude's / ChatGPT's): the
    // site's own toolbar on the page, the site's view under it.
    <div
      data-sheet-fill=""
      className={cn(sheetFillClassName, "flex min-h-[520px] flex-col")}
    >
      <LeadToolbar id={site.id} fallback={site.url} />
      <div
        ref={area}
        // The site's view lies over this, flush with the panel's hairline:
        // the panel's resize grip keeps to the panel's side (globals.css).
        data-lead-view={native ? "" : undefined}
        className="relative flex min-h-0 flex-1"
      >
        {/* Nothing moving under the view (a spinner here repainted the
            page every frame behind the site); a picture of it while an
            overlay needs it out of the way. */}
        {shot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shot}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover object-left-top"
          />
        )}
      </div>
    </div>
  )
}

/** The site's toolbar (a browser pane's): back, forward, reload, where it
 *  is, open in the browser. On the page, above the view, so its tooltips
 *  never fall over the site. */
function LeadToolbar({ id, fallback }: { id: string; fallback: string }) {
  const t = useT("leads")
  const [state, setState] = useState<LeadState | null>(null)
  // The site moves itself (links, its own app routes): read where it is,
  // quicker while it loads.
  useEffect(() => {
    let alive = true
    let timer = 0
    const read = async () => {
      if (document.visibilityState === "visible") {
        const now = await leadState(id)
        if (!alive) return
        if (now) setState(now)
        timer = window.setTimeout(read, now?.loading ? 300 : 1000)
        return
      }
      timer = window.setTimeout(read, 1000)
    }
    void read()
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [id])
  const url = state?.url || fallback
  let shown = url
  try {
    const u = new URL(url)
    shown =
      u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname)
  } catch {}
  const loading = state?.loading ?? false
  const button = (
    label: string,
    action: "back" | "forward" | "reload" | "stop",
    icon: React.ReactNode,
    disabled = false,
  ) => (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            disabled={disabled}
            className="text-foreground/55 hover:text-foreground"
            onClick={() => void navLead(id, action)}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
  return (
    <div className="border-border relative flex h-11 shrink-0 items-center gap-1.5 border-b px-2">
      {button(t("back"), "back", <ArrowLeft />, state ? !state.back : false)}
      {button(t("forward"), "forward", <ArrowRight />, state ? !state.forward : false)}
      {loading
        ? button(t("stop"), "stop", <X />)
        : button(t("reload"), "reload", <RotateCw />)}
      <span className="text-muted-foreground text-meta min-w-0 flex-1 truncate px-1.5">
        {shown}
      </span>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("openInBrowser")}
              className="text-foreground/55 hover:text-foreground"
              nativeButton={false}
              render={<a href={url} target="_blank" rel="noreferrer" />}
            />
          }
        >
          <RiExternalLinkLine />
        </TooltipTrigger>
        <TooltipContent side="top">{t("openInBrowser")}</TooltipContent>
      </Tooltip>
      {/* Loading: a thin bar along the toolbar's bottom edge (static: no
          motion in WebKit). */}
      {loading && (
        <span
          aria-hidden
          className="bg-primary/60 absolute inset-x-0 -bottom-px h-0.5"
        />
      )}
    </div>
  )
}
