"use client"

import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { useT } from "@/shared/i18n/client"
import { RiSearchLine } from "@/shared/ui/lucide-icons"
import {
  OPEN_SEARCH_EVENT,
  type OpenSearchDetail,
} from "@/shared/context-menu/events"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { useMountOnce } from "@/shared/hooks/useMountOnce"

const loadDialog = () => import("./GlobalSearchDialog")
const GlobalSearchDialog = dynamic(loadDialog, { ssr: false })
const preloadDialog = () => void loadDialog()

/** Opens with ⌘K / Ctrl+K from anywhere, or from the top bar field. */
/** A sidebar row like Beranda (icon, label, ⌘K hint). */
export function GlobalSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  // Text to start with (the right-click menu's "Cari di app").
  const [initialQuery, setInitialQuery] = useState("")
  const mounted = useMountOnce(open)
  const [isMac, setIsMac] = useState(true)
  const tc = useT("common")

  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.userAgent))
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        preloadDialog()
        setOpen((o) => !o)
      }
    }
    const onOpenSearch = (e: Event) => {
      const { query } = (e as CustomEvent<OpenSearchDetail>).detail ?? {}
      preloadDialog()
      setInitialQuery(query ?? "")
      setOpen(true)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener(OPEN_SEARCH_EVENT, onOpenSearch)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpenSearch)
    }
  }, [])

  const openSearch = () => {
    setInitialQuery("")
    setOpen(true)
  }
  const dialog = mounted && (
    <GlobalSearchDialog
      open={open}
      onOpenChange={setOpen}
      initialQuery={initialQuery}
    />
  )

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={tc("search")}
        onClick={openSearch}
        onMouseEnter={preloadDialog}
        onFocus={preloadDialog}
        aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
        className={cn("not-data-active:blend-ink", className)}
      >
        <RiSearchLine />
        <span className="truncate">{tc("search")}</span>
        <KbdGroup className="ml-auto group-data-[collapsible=icon]:hidden">
          <Kbd className="bg-chrome-field rounded-full">
            {isMac ? "⌘" : "Ctrl"}
          </Kbd>
          <Kbd className="bg-chrome-field rounded-full">K</Kbd>
        </KbdGroup>
      </SidebarMenuButton>
      {dialog}
    </SidebarMenuItem>
  )
}
