import { Button } from '@/components/ui'
import {
  RiArrowLeftDoubleLine,
  RiArrowLeftSLine,
  RiArrowRightDoubleLine,
  RiArrowRightSLine,
} from "@remixicon/react"
import { Table } from "@tanstack/react-table"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

/**
 * Pagination controls for DataTable.
 */
export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const paginationButtons = [
    {
      icon: RiArrowLeftDoubleLine,
      onClick: () => table.setPageIndex(0),
      disabled: !table.getCanPreviousPage(),
      srText: "First page",
      mobileView: "hidden sm:block",
    },
    {
      icon: RiArrowLeftSLine,
      onClick: () => table.previousPage(),
      disabled: !table.getCanPreviousPage(),
      srText: "Previous page",
      mobileView: "",
    },
    {
      icon: RiArrowRightSLine,
      onClick: () => table.nextPage(),
      disabled: !table.getCanNextPage(),
      srText: "Next page",
      mobileView: "",
    },
    {
      icon: RiArrowRightDoubleLine,
      onClick: () => table.setPageIndex(table.getPageCount() - 1),
      disabled: !table.getCanNextPage(),
      srText: "Last page",
      mobileView: "hidden sm:block",
    },
  ]

  return (
    <div className="flex items-center justify-end py-2">
      <div className="flex items-center gap-x-1.5">
        {paginationButtons.map((button, index) => (
          <Button
            key={index}
            variant="secondary"
            size="sm"
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
