"use client"

import type { ReactNode } from "react"
import { EllipsisIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"

export interface DataTableRowAction {
  label: string
  onClick: () => void
  icon?: ReactNode
  destructive?: boolean
  disabled?: boolean
}

interface DataTableRowActionsProps {
  actions: DataTableRowAction[]
  align?: "start" | "end"
  triggerLabel?: string
  triggerIcon?: ReactNode
  contentClassName?: string
}

export function DataTableRowActions({
  actions,
  align = "end",
  triggerLabel,
  triggerIcon,
  contentClassName,
}: DataTableRowActionsProps) {
  const t = useT("shell")
  if (!actions || actions.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label={triggerLabel ?? t("dataTableRowActions")}
            // Don't toggle row selection when opening the menu
            onClick={(event) => event.stopPropagation()}
            className="text-muted-foreground data-popup-open:bg-muted"
          />
        }
      >
        {triggerIcon ?? (
          <EllipsisIcon className="size-4 shrink-0" aria-hidden="true" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={cn("min-w-32", contentClassName)}
        onClick={(event) => event.stopPropagation()}
      >
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={action.onClick}
            disabled={action.disabled}
            variant={action.destructive ? "destructive" : "default"}
            className="flex items-center gap-2"
          >
            {action.icon ? (
              <span className="text-muted-foreground flex size-4 shrink-0 items-center justify-center">
                {action.icon}
              </span>
            ) : null}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type { DataTableRowActionsProps }
