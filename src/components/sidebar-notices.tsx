"use client"

import { useDesktopShell } from "@/components/desktop-shell"
import { useMacDownload } from "@/components/mac-download"
import { cn } from "@/lib/utils"
import {
  useDeviceFlag,
  useLatestMacRelease,
  useMacUpdate,
} from "@/shared/hooks/useMacApp"
import { useT } from "@/shared/i18n/client"
import {
  downloadablePlatform,
  installUpdate,
  type AppPlatform,
} from "@/shared/lib/desktop-app"
import { useWhatsNewNotice } from "@/page-slices/whats-new/ui/whats-new-notice"
import { Download, RotateCw, X } from "@/components/icons"
import { Fragment, useEffect, useState, type ReactNode } from "react"

/**
 * Cards at the bottom of the sidebar, above its footer: one small rounded
 * card per notice (title + one-line subtitle, a round icon button on the
 * right), at most two at a time, the most important first.
 *
 * Adding a notice: write a hook that returns a `SidebarNotice` (or null
 * when it shouldn't show), with its priority from `NOTICE_PRIORITY`, and
 * call it in `useNotices` below. Extra UI it opens (a dialog) goes in
 * `element`. Or render `SidebarNoticeCard` yourself for a one-off.
 */

export const NOTICE_PRIORITY = {
  update: 0,
  whatsNew: 1,
  downloadMac: 2,
} as const

export type SidebarNoticeTone = "default" | "accent"

export type SidebarNoticeCardProps = {
  title: ReactNode
  subtitle?: ReactNode
  /** The round button's icon (a lucide icon element). */
  icon: ReactNode
  onClick: () => void
  /** Shows a small × on hover; hide the card for good from here. */
  onDismiss?: () => void
  tone?: SidebarNoticeTone
  /** Names the round button for screen readers (defaults to the title). */
  actionLabel?: string
  className?: string
}

export type SidebarNotice = SidebarNoticeCardProps & {
  id: string
  /** Lower shows first (see NOTICE_PRIORITY). */
  priority: number
  /** Rendered even when the card isn't (dialogs the card opens). */
  element?: ReactNode
}

/** One notice card. Hidden while the sidebar is collapsed to icons. */
export function SidebarNoticeCard({
  title,
  subtitle,
  icon,
  onClick,
  onDismiss,
  tone = "default",
  actionLabel,
  className,
}: SidebarNoticeCardProps) {
  const t = useT("desktopApp")
  return (
    <div
      data-slot="sidebar-notice"
      data-tone={tone}
      className={cn(
        "group/notice relative flex items-center gap-2 rounded-xl py-2.5 pr-2 pl-3 transition-colors group-data-[collapsible=icon]:hidden",
        // Solid, so the (translucent) sidebar doesn't show through; the
        // accent tone is told apart by its blue button.
        "bg-card hover:bg-muted shadow-(--elev-1)",
        className,
      )}
    >
      {/* The whole card is the action; the round button is its face. */}
      <button
        type="button"
        onClick={onClick}
        className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        aria-label={
          actionLabel ?? (typeof title === "string" ? title : undefined)
        }
      />
      <div className="pointer-events-none min-w-0 flex-1">
        <p className="text-foreground text-meta truncate leading-5 font-medium">
          {title}
        </p>
        {subtitle && (
          <p className="text-muted-foreground text-micro truncate leading-4">
            {subtitle}
          </p>
        )}
      </div>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none flex size-7 shrink-0 items-center justify-center rounded-full [&_svg]:size-4",
          tone === "accent"
            ? "bg-primary text-primary-foreground"
            : "bg-background text-foreground shadow-(--elev-1) dark:bg-white/10",
        )}
      >
        {icon}
      </span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("dismiss")}
          className="bg-background text-muted-foreground hover:text-foreground border-border absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full border opacity-0 shadow-(--elev-1) transition-opacity group-hover/notice:opacity-100 focus-visible:opacity-100 [&_svg]:size-3"
        >
          <X />
        </button>
      )}
    </div>
  )
}

/**
 * Kretya Flow: a newer version than the one running (inside the app).
 * Downloaded by the in-place updater: "Update siap", restart to install.
 * Without it (an older app, or it failed): the .dmg to download.
 */
function useUpdateNotice(): SidebarNotice | null {
  const t = useT("desktopApp")
  const desktop = useDesktopShell()
  const { available, updater } = useMacUpdate(desktop)
  const readyVersion =
    updater?.phase === "ready" && updater.version ? updater.version : null
  const [dismissed, dismiss] = useDeviceFlag(
    readyVersion
      ? `krty-update-ready-card-dismissed-${readyVersion}`
      : available
        ? `krty-update-card-dismissed-${available.version}`
        : null,
  )
  const { start, dialog } = useMacDownload()
  const [installing, setInstalling] = useState(false)
  if (!desktop || dismissed !== false) return null
  if (readyVersion)
    return {
      id: "update",
      priority: NOTICE_PRIORITY.update,
      title: t("readyTitle"),
      subtitle: installing
        ? t("installing")
        : t("readySubtitle", { version: readyVersion }),
      icon: <RotateCw />,
      tone: "accent",
      actionLabel: t("restartToUpdate"),
      onClick: () => {
        if (installing) return
        setInstalling(true)
        // Relaunches on success; an answer means it failed (the updater's
        // error then shows in Setelan app, and the .dmg card takes over).
        void installUpdate().finally(() => setInstalling(false))
      },
      onDismiss: dismiss,
    }
  if (!available) return null
  return {
    id: "update",
    priority: NOTICE_PRIORITY.update,
    element: dialog,
    title: t("updateTitle"),
    subtitle: t("updateSubtitle", { version: available.version }),
    icon: <Download />,
    tone: "accent",
    actionLabel: t("downloadUpdate"),
    onClick: () => void start("update", available),
    onDismiss: dismiss,
  }
}

/** On the web, on a Mac or a Windows PC: get the app for it. */
function useDownloadMacNotice(): SidebarNotice | null {
  const t = useT("desktopApp")
  const desktop = useDesktopShell()
  const [platform, setPlatform] = useState<AppPlatform | null>(null)
  useEffect(
    () => setPlatform(desktop ? null : downloadablePlatform()),
    [desktop],
  )
  const { data: release } = useLatestMacRelease(Boolean(platform))
  const [dismissed, dismiss] = useDeviceFlag(
    platform === "windows"
      ? "krty-windows-download-card-dismissed"
      : platform
        ? "krty-mac-download-card-dismissed"
        : null,
  )
  const { start, dialog } = useMacDownload()
  if (!platform || !release || dismissed !== false) return null
  const win = platform === "windows"
  return {
    id: "download-mac",
    priority: NOTICE_PRIORITY.downloadMac,
    element: dialog,
    title: win ? t("windowsTitle") : t("macTitle"),
    subtitle: win ? t("windowsSubtitle") : t("macSubtitle"),
    icon: <Download />,
    actionLabel: win ? t("menuDownloadWindows") : t("downloadMac"),
    // Never on phone widths (the sidebar is a sheet there).
    className: "max-md:hidden",
    onClick: () => void start("install", release),
    onDismiss: dismiss,
  }
}

/** Every notice source, in any order (sorted by priority). */
function useNotices(): (SidebarNotice | null)[] {
  return [
    useUpdateNotice(),
    // Yang baru: unseen entries (page-slices/whats-new).
    useWhatsNewNotice(NOTICE_PRIORITY.whatsNew),
    useDownloadMacNotice(),
  ]
}

const MAX_VISIBLE = 2

/** The sidebar's notice slot (mounted by AppSidebar above its footer). */
export function SidebarNotices() {
  const notices = useNotices()
    .filter((n): n is SidebarNotice => Boolean(n))
    .sort((a, b) => a.priority - b.priority)
  const visible = notices.slice(0, MAX_VISIBLE)
  return (
    <>
      {notices.map(
        (n) => n.element && <Fragment key={n.id}>{n.element}</Fragment>,
      )}
      {visible.length > 0 && (
        <div
          data-slot="sidebar-notices"
          className="flex flex-col gap-2 px-2 pb-1 group-data-[collapsible=icon]:hidden"
        >
          {visible.map(({ id, priority: _p, element: _e, ...card }) => (
            <SidebarNoticeCard key={id} {...card} />
          ))}
        </div>
      )}
    </>
  )
}
