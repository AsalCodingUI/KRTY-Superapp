"use client"

import * as React from "react"
import type { Column } from "@tanstack/react-table"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const canSort = column.getCanSort()
  const isSorted = column.getIsSorted()

  if (!canSort) {
    return (
      <div className={cn("text-label-sm text-muted-foreground", className)}>
        {title}
      </div>
    )
  }

  return (
    <div
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "flex cursor-pointer items-center gap-2 select-none",
        className,
      )}
    >
      <span className="text-label-sm whitespace-nowrap text-muted-foreground">
        {title}
      </span>
      {/* Stacked sort indicator */}
      <div className="-space-y-2">
        <ChevronUpIcon
          className={cn(
            "size-3.5 text-muted-foreground",
            isSorted === "desc" && "opacity-30",
          )}
          aria-hidden="true"
        />
        <ChevronDownIcon
          className={cn(
            "size-3.5 text-muted-foreground",
            isSorted === "asc" && "opacity-30",
          )}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

export type { DataTableColumnHeaderProps }
