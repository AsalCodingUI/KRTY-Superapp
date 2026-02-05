"use client"

import { Button } from "@/components/ui"
import { cx } from "@/shared/lib/utils"
import { RiMoreFill } from "@/shared/ui/lucide-icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui"
import type { ReactNode } from "react"

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
  triggerLabel = "Row actions",
  triggerIcon,
  contentClassName,
}: DataTableRowActionsProps) {
  if (!actions || actions.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="group data-[state=open]:bg-muted aspect-square hover:border data-[state=open]:border hover:dark:border data-[state=open]:dark:border"
          aria-label={triggerLabel}
        >
          {triggerIcon ?? (
            <RiMoreFill
              className="text-content-subtle group-hover:text-content-subtle group-data-[state=open]:text-content-subtle group-hover:dark:text-content-subtle group-data-[state=open]:dark:text-content-subtle size-4 shrink-0"
              aria-hidden="true"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cx("min-w-32", contentClassName)}>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={action.onClick}
            disabled={action.disabled}
            className={cx(
              "flex items-center gap-2",
              action.destructive && "text-danger focus:text-danger",
            )}
          >
            {action.icon ? (
              <span className="text-content-subtle size-4 shrink-0">
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
