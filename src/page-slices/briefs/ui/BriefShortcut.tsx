"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { accessLevel, canRunProjects } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { FileText } from "lucide-react"
import dynamic from "next/dynamic"
import { useState, type SyntheticEvent } from "react"
import { useBriefLinks } from "../model/data"
import { BriefStatusDot } from "./shared"

const BriefDialog = dynamic(
  () => import("./BriefDialog").then((m) => m.BriefDialog),
  { ssr: false },
)

/**
 * A project's linked briefs as shortcuts: a small "Brief" chip on list rows,
 * board cards and table rows, a button in the project's header. Opens the
 * brief's answers right there, without leaving the page.
 */
export function BriefShortcut({
  projectId,
  variant = "chip",
  className,
}: {
  projectId: string
  variant?: "chip" | "button"
  className?: string
}) {
  const t = useT("briefs")
  const { profile } = useUserProfile()
  const canManage = canRunProjects(accessLevel(profile))
  const { data } = useBriefLinks()
  const [open, setOpen] = useState<string | null>(null)
  const briefs = data?.get(projectId) ?? []
  if (!briefs.length) return null

  // Rows and cards are links (and drag handles): the shortcut is its own.
  const stop = (e: SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <>
      {briefs.map((brief) =>
        variant === "button" ? (
          <Button
            key={brief.id}
            variant="outline"
            onClick={() => setOpen(brief.id)}
            className={cn("max-w-56", className)}
          >
            <FileText data-icon="inline-start" />
            <span className="truncate">{brief.title}</span>
          </Button>
        ) : (
          <span
            key={brief.id}
            role="button"
            tabIndex={0}
            title={brief.title}
            aria-label={t("openBrief", { title: brief.title })}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              stop(e)
              setOpen(brief.id)
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return
              stop(e)
              setOpen(brief.id)
            }}
            className={cn(
              "text-muted-foreground hover:text-foreground hover:bg-muted relative z-10 inline-flex h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)",
              className,
            )}
          >
            <FileText className="size-3.5" />
            Brief
            <BriefStatusDot status={brief.status} />
          </span>
        ),
      )}
      {open && (
        // React events from the dialog (a portal) still bubble up the
        // component tree, into the row's link and drag handlers: stop them.
        <span
          className="contents"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.stopPropagation()}
        >
          <BriefDialog
            briefId={open}
            canManage={canManage}
            onClose={() => setOpen(null)}
          />
        </span>
      )}
    </>
  )
}
