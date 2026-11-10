"use client"

import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
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
/** The sidebar's search pill (⌘K / Ctrl+K from anywhere). */
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

  // An outlined pill on the chrome (Obvious-style), above the nav.
  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        onMouseEnter={preloadDialog}
        onFocus={preloadDialog}
        aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
        className={cn(
          "text-muted-foreground hover:text-foreground border-chrome-border hover:bg-chrome-hover rounded-control flex h-8 w-full items-center gap-2 border-[0.5px] pr-1.5 pl-2.5 text-sm transition-colors",
          // In the collapsed sidebar: the icon alone.
          "group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0",
          className,
        )}
      >
        <RiSearchLine className="size-4" />
        <span className="group-data-[collapsible=icon]:sr-only">
          {tc("search")}
        </span>
        <KbdGroup className="ml-auto group-data-[collapsible=icon]:hidden">
          <Kbd className="bg-chrome-field rounded-full">
            {isMac ? "⌘" : "Ctrl"}
          </Kbd>
          <Kbd className="bg-chrome-field rounded-full">K</Kbd>
        </KbdGroup>
      </button>
      {/* Mounted on first open, then kept so the close animation plays. */}
      {dialog}
    </>
  )
}
