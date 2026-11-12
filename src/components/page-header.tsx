"use client"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { RiArrowLeftLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"
import * as React from "react"

export type PageBack =
  | { href: string; label: string }
  | { onClick: () => void; label: string }

/** Page title block: the one large heading a page has, plus its actions. */
export function PageHeader({
  title,
  back,
  actions,
  className,
}: {
  title: React.ReactNode
  /** Square ← button before the title; `label` names where it goes. */
  back?: PageBack
  actions?: React.ReactNode
  className?: string
}) {
  return (
    // 12px to the content under it (callers may drop it: pb-0).
    <div className={cn("pb-3", className)}>
      {/* The title row, as on the list | detail pages (SplitPaneTitle):
          32px, its top 12px from the sheet's (the sheet's own pt-3), level
          with the sidebar panel's "Kantor". */}
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          {back && <BackButton back={back} />}
          {/* 14px medium, like "Kantor" (and the list pages' titles). A
              control as the title is a flex item, not inline text. */}
          <h1
            className={cn(
              "text-foreground min-w-0 text-sm font-medium",
              typeof title === "string" || typeof title === "number"
                ? "truncate"
                : "flex items-center",
            )}
          >
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}

function BackButton({ back }: { back: PageBack }) {
  const t = useT("common")
  const label = t("backTo", { label: back.label })
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          "href" in back ? (
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={label}
              className="text-muted-foreground hover:text-foreground shrink-0"
              nativeButton={false}
              render={<Link href={back.href} prefetch={false} />}
            />
          ) : (
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={label}
              className="text-muted-foreground hover:text-foreground shrink-0"
              onClick={back.onClick}
            />
          )
        }
      >
        <RiArrowLeftLine />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
