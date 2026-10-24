"use client"

import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { RiSearchLine } from "@/shared/ui/lucide-icons"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

const loadDialog = () => import("./GlobalSearchDialog")
const GlobalSearchDialog = dynamic(loadDialog, { ssr: false })
const preloadDialog = () => void loadDialog()

/** True from the first time `open` is true onwards. */
function useMountOnce(open: boolean) {
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  return mounted
}

/** Opens with ⌘K / Ctrl+K from anywhere, or from the top bar field. */
export function GlobalSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
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
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={preloadDialog}
        onFocus={preloadDialog}
        aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
        className={cn(
          "text-muted-foreground hover:text-foreground bg-chrome-field hover:bg-chrome-hover blend-ink flex h-8 w-full items-center gap-2 rounded-lg pr-1.5 pl-2.5 text-sm transition-colors",
          className,
        )}
      >
        <RiSearchLine className="size-4" />
        <span>{tc("search")}</span>
        <KbdGroup className="ml-auto">
          <Kbd className="bg-chrome-field">{isMac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd className="bg-chrome-field">K</Kbd>
        </KbdGroup>
      </button>
      {/* Mounted on first open, then kept so the close animation plays. */}
      {mounted && <GlobalSearchDialog open={open} onOpenChange={setOpen} />}
    </>
  )
}
