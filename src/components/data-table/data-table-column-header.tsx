"use client"

import * as React from "react"
import type { Column } from "@tanstack/react-table"
import {
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
} from "@/components/icons"

import { cn } from "@/lib/utils"

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
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
      <div
        className={cn(
          "text-muted-foreground text-[13px] font-medium",
          className,
        )}
      >
        {title}
      </div>
    )
  }

  // One quiet arrow: shown when sorted, hinted on hover otherwise.
  const Arrow = isSorted === "asc" ? ChevronUpIcon : ChevronDownIcon
  return (
    <div
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "group/sort flex cursor-pointer items-center gap-1 select-none",
        className,
      )}
    >
      <span
        className={cn(
          "text-[13px] font-medium whitespace-nowrap transition-colors",
          isSorted
            ? "text-foreground"
            : "text-muted-foreground group-hover/sort:text-foreground",
        )}
      >
        {title}
      </span>
      <Arrow
        className={cn(
          "size-3.5 transition-opacity",
          isSorted
            ? "text-foreground opacity-100"
            : "text-muted-foreground opacity-0 group-hover/sort:opacity-100",
        )}
        aria-hidden="true"
      />
    </div>
  )
}

export type { DataTableColumnHeaderProps }
