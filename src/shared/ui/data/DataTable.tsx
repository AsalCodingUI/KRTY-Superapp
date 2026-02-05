"use client"

import { cx } from "@/shared/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/shared/ui"
import { TableSection } from "@/shared/ui/structure/TableSection"
import * as React from "react"

import { DataTableBulkEditor } from "./DataTableBulkEditor"
import { Filterbar } from "./DataTableFilterbar"
import { DataTablePagination } from "./DataTablePagination"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

/**
 * DataTable component with built-in pagination, filtering, sorting, and bulk actions.
 * Powered by TanStack Table with custom styling.
 *
 * @param columns - Column definitions using TanStack Table ColumnDef
 * @param data - Array of data to display in the table
 * @param onCreate - Callback when create button is clicked
 * @param onEdit - Callback when edit action is triggered on a row
 * @param onDelete - Async callback for bulk delete operations
 * @param showExport - Show export button in filterbar
 * @param showViewOptions - Show column visibility options
 * @param actionLabel - Custom label for the create button
 * @param enableSelection - Enable row selection (default: true)
 * @param enableHover - Enable hover effects on rows (default: true)
 * @param manualPagination - Use manual pagination control (default: false)
 * @param pageCount - Total page count for manual pagination
 * @param pageIndex - Current page index for manual pagination
 * @param onPageChange - Callback when page changes (manual pagination)
 * @param searchKey - Key to use for search filtering
 * @param showPagination - Show pagination controls (default: true)
 * @param showFilterbar - Show filterbar with search and actions (default: true)
 * @param showTableWrapper - Wrap table in TableSection component
 * @param tableTitle - Title for TableSection wrapper
 * @param tableDescription - Description for TableSection wrapper
 * @param tableActions - Custom actions for TableSection wrapper
 *
 * @example
 * ```tsx
 * // Basic table
 * <DataTable
 *   columns={columns}
 *   data={data}
 * />
 *
 * // With CRUD operations
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   onCreate={() => setDialogOpen(true)}
 *   onEdit={(row) => handleEdit(row)}
 *   onDelete={async (ids) => await deleteRows(ids)}
 * />
 *
 * // With manual pagination
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   manualPagination
 *   pageCount={totalPages}
 *   pageIndex={currentPage}
 *   onPageChange={(page) => setCurrentPage(page)}
 * />
 *
 * // With TableSection wrapper
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   showTableWrapper
 *   tableTitle="Users"
 *   tableDescription="Manage your team members"
 * />
 * ```
 */
export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  onCreate?: () => void
  onEdit?: (item: TData) => void
  onDelete?: (ids: string[] | number[]) => Promise<void>
  showExport?: boolean
  showViewOptions?: boolean
  actionLabel?: string
  enableSelection?: boolean
  enableHover?: boolean
  manualPagination?: boolean
  pageCount?: number
  pageIndex?: number
  onPageChange?: (pageIndex: number) => void
  searchKey?: string
  showPagination?: boolean
  showFilterbar?: boolean
  noBorder?: boolean
  // NEW: TableSection wrapper props
  showTableWrapper?: boolean
  tableTitle?: string
  tableDescription?: string
  tableActions?: React.ReactNode
}

export function DataTable<TData>({
  columns,
  data,
  onCreate,
  onEdit,
  onDelete,
  showExport,
  showViewOptions,
  actionLabel,
  enableSelection = true,
  enableHover = true,
  manualPagination = false,
  pageCount,
  pageIndex,
  onPageChange,
  searchKey,
  showPagination = true,
  showFilterbar = true,
  // NEW: Wrapper props
  showTableWrapper = false,
  tableTitle,
  tableDescription,
  tableActions,
  defaultPageSize = 20,
}: DataTableProps<TData> & { defaultPageSize?: number }) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [internalPagination, setInternalPagination] = React.useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })

  const paginationState = manualPagination
    ? { pageIndex: pageIndex ?? 0, pageSize: defaultPageSize }
    : internalPagination

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      pagination: paginationState,
    },
    pageCount: manualPagination ? pageCount : undefined,
    manualPagination: manualPagination,
    onPaginationChange: manualPagination
      ? (updater) => {
          if (typeof updater === "function") {
            const newState = updater(paginationState)
            onPageChange?.(newState.pageIndex)
          } else {
            onPageChange?.(updater.pageIndex)
          }
        }
      : setInternalPagination,
    initialState: { pagination: { pageIndex: 0, pageSize: defaultPageSize } },
    enableRowSelection: enableSelection,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => (row as { id: string | number }).id.toString(),
  })

  const tableContent = (
    <>
      <div className={showFilterbar ? "space-y-4" : ""}>
        {showFilterbar && (
          <div className="mb-4">
            <Filterbar
              table={table}
              onCreate={onCreate}
              showExport={showExport}
              showViewOptions={showViewOptions}
              actionLabel={actionLabel}
              searchKey={searchKey}
            />
          </div>
        )}

        {/* CONTAINER TABLE: Overflow hidden for rounded corners, auto for scroll */}
        <div className="relative overflow-hidden">
          <div className="overflow-x-auto">
            <Table noBorder>
              <TableHead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHeaderCell
                        key={header.id}
                        className={cx(
                          "whitespace-nowrap",
                          header.column.columnDef.meta?.className,
                        )}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </TableHeaderCell>
                    ))}
                  </TableRow>
                ))}
              </TableHead>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      onClick={
                        enableSelection
                          ? () => row.toggleSelected(!row.getIsSelected())
                          : undefined
                      }
                      className={cx(
                        "group transition-colors select-none",
                        enableHover
                          ? "hover:bg-surface-state-neutral-light-hover"
                          : "",
                        enableSelection ? "cursor-pointer" : "cursor-default",
                      )}
                    >
                      {row.getVisibleCells().map((cell, index) => (
                        <TableCell
                          key={cell.id}
                          className={cx(
                            "relative whitespace-nowrap",
                            cell.column.columnDef.meta?.className,
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center"
                    >
                      <div className="text-content-subtle flex flex-col items-center justify-center gap-2">
                        <svg
                          className="text-content-placeholder size-8"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <p className="text-label-md">No data available</p>
                        <p className="text-content-placeholder text-label-xs">
                          Data will appear here once added
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {onDelete && enableSelection && (
              <DataTableBulkEditor
                table={table}
                rowSelection={rowSelection}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )}
          </div>
        </div>
        {showPagination && (
          <div className={showTableWrapper ? "px-4 pb-3" : ""}>
            <DataTablePagination table={table} />
          </div>
        )}
      </div>
    </>
  )

  if (showTableWrapper) {
    return (
      <TableSection
        title={tableTitle}
        description={tableDescription}
        actions={tableActions}
      >
        {tableContent}
      </TableSection>
    )
  }

  return tableContent
}
