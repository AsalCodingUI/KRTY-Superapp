"use client"

import type { Table } from "@tanstack/react-table"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

/**
 * Pagination controls for DataTable. Renders nothing when there is a single page.
 */
export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  if (table.getPageCount() <= 1) {
    return null
  }

  const paginationButtons = [
    {
      icon: ChevronsLeftIcon,
      onClick: () => table.setPageIndex(0),
      disabled: !table.getCanPreviousPage(),
      srText: "First page",
      mobileView: "hidden sm:inline-flex",
    },
    {
      icon: ChevronLeftIcon,
      onClick: () => table.previousPage(),
      disabled: !table.getCanPreviousPage(),
      srText: "Previous page",
      mobileView: "",
    },
    {
      icon: ChevronRightIcon,
      onClick: () => table.nextPage(),
      disabled: !table.getCanNextPage(),
      srText: "Next page",
      mobileView: "",
    },
    {
      icon: ChevronsRightIcon,
      onClick: () => table.setPageIndex(table.getPageCount() - 1),
      disabled: !table.getCanNextPage(),
      srText: "Last page",
      mobileView: "hidden sm:inline-flex",
    },
  ]

  return (
    <div className="flex items-center justify-end py-2">
      <div className="flex items-center gap-x-1.5">
        {paginationButtons.map((button) => (
          <Button
            key={button.srText}
            variant="outline"
            size="icon-sm"
            className={button.mobileView}
            onClick={() => {
              button.onClick()
              table.resetRowSelection()
            }}
            disabled={button.disabled}
            aria-label={button.srText}
          >
            <span className="sr-only">{button.srText}</span>
            <button.icon className="size-4 shrink-0" aria-hidden="true" />
          </Button>
        ))}
      </div>
    </div>
  )
}

export type { DataTablePaginationProps }
