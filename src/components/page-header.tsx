"use client"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
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
  /** @deprecated titles stand alone now (Mercury style); ignored. */
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-4 gap-y-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {back && <BackButton back={back} />}
        <h1 className="text-heading min-w-0 truncate text-2xl font-normal tracking-tight">
          {title}
        </h1>
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

function BackButton({ back }: { back: PageBack }) {
  const label = `Kembali ke ${back.label}`
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
