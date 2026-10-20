"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
} from "@tanstack/react-table"
import { FileTextIcon } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { TableSection } from "@/components/table-section"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { DataTableBulkEditor } from "./data-table-bulk-editor"
import { DataTableFilterbar } from "./data-table-filterbar"
import { DataTablePagination } from "./data-table-pagination"

/**
 * DataTable with built-in pagination, filtering, sorting, and bulk actions.
 * Powered by TanStack Table, rendered with shadcn `Table`.
 *
 * @example
 * ```tsx
 * <DataTable columns={columns} data={data} />
 *
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   onCreate={() => setDialogOpen(true)}
 *   onEdit={(row) => handleEdit(row)}
 *   onDelete={async (ids) => await deleteRows(ids)}
 * />
 *
 * <DataTable columns={columns} data={data} manualPagination
 *   pageCount={totalPages} pageIndex={currentPage} onPageChange={setCurrentPage} />
 *
 * <DataTable columns={columns} data={data} showTableWrapper
 *   tableTitle="Users" tableDescription="Manage your team members" />
 * ```
 */
export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  onCreate?: () => void
  onEdit?: (item: TData) => void
  onDelete?: (ids: string[] | number[]) => Promise<void>
  onBulkApprove?: (ids: string[] | number[]) => Promise<void>
  onBulkReject?: (ids: string[] | number[]) => Promise<void>
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
  /** Accepted for API compatibility (the table is always borderless). */
  noBorder?: boolean
  // TableSection wrapper props
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
  onBulkApprove,
  onBulkReject,
  showExport,
  showViewOptions = false,
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
  showTableWrapper = false,
  tableTitle,
  tableDescription,
  tableActions,
  defaultPageSize = 20,
}: DataTableProps<TData> & { defaultPageSize?: number }) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [internalPagination, setInternalPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: defaultPageSize,
    })

  const paginationState: PaginationState = manualPagination
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
    manualPagination,
    onPaginationChange: manualPagination
      ? (updater) => {
          const next =
            typeof updater === "function" ? updater(paginationState) : updater
          onPageChange?.(next.pageIndex)
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

  const rows = table.getRowModel().rows
  const hasBulkActions =
    enableSelection && Boolean(onDelete || onBulkApprove || onBulkReject || onEdit)

  const tableContent = (
    <div className={showFilterbar ? "space-y-4" : ""}>
      {showFilterbar && (
        <div className="mb-4">
          <DataTableFilterbar
            table={table}
            onCreate={onCreate}
            showExport={showExport}
            showViewOptions={showViewOptions}
            actionLabel={actionLabel}
            searchKey={searchKey}
          />
        </div>
      )}

      <div
        className="relative overflow-hidden"
        role="region"
        aria-label="Data table"
        tabIndex={0}
      >
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const isSelectionColumn = header.column.id === "select"
                  if (isSelectionColumn && !enableSelection) return null
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-10 px-3 py-2 text-label-sm whitespace-nowrap text-muted-foreground",
                        isSelectionColumn && "w-14 px-2 text-center",
                        header.column.columnDef.meta?.className,
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={
                    enableSelection
                      ? () => row.toggleSelected(!row.getIsSelected())
                      : undefined
                  }
                  className={cn(
                    "group transition-colors select-none",
                    enableHover ? "hover:bg-accent" : "hover:bg-transparent",
                    enableSelection ? "cursor-pointer" : "cursor-default",
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isSelectionColumn = cell.column.id === "select"
                    if (isSelectionColumn && !enableSelection) return null
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "relative h-10 px-3 py-2 text-body-sm whitespace-nowrap",
                          isSelectionColumn && "w-14 px-2 text-center",
                          cell.column.columnDef.meta?.className,
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-6">
                  <EmptyState
                    title="No data available"
                    description="No rows to display."
                    icon={<FileTextIcon className="size-5" />}
                    placement="inner"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {hasBulkActions && (
          <DataTableBulkEditor
            table={table}
            rowSelection={rowSelection}
            onEdit={onEdit}
            onDelete={onDelete}
            onApprove={onBulkApprove}
            onReject={onBulkReject}
          />
        )}
      </div>

      {showPagination && (
        <div className={showTableWrapper ? "px-4" : ""}>
          <DataTablePagination table={table} />
        </div>
      )}
    </div>
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
