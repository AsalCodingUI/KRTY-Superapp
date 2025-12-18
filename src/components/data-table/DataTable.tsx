"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/Table"
import { TableSection } from "@/components/TableSection"
import { cx } from "@/lib/utils"
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

interface DataTableProps<TData> {
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
  noBorder = false,
  // NEW: Wrapper props
  showTableWrapper = false,
  tableTitle,
  tableDescription,
  tableActions
}: DataTableProps<TData>) {
  const pageSize = 20
  const [rowSelection, setRowSelection] = React.useState({})
  const [internalPagination, setInternalPagination] = React.useState({
    pageIndex: 0,
    pageSize: pageSize,
  })

  const paginationState = manualPagination
    ? { pageIndex: pageIndex ?? 0, pageSize }
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
    initialState: { pagination: { pageIndex: 0, pageSize: pageSize } },
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

        {/* CONTAINER TABLE: Pastikan overflow hidden biar rapi */}
        <div className="relative overflow-hidden overflow-x-auto">
          <Table noBorder={noBorder}>
            <TableHead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  // HAPUS CLASS BORDER DI SINI. Biarkan TableHead yang ngatur border-b
                  className="hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHeaderCell
                      key={header.id}
                      className={cx(
                        "whitespace-nowrap py-2 text-sm font-medium sm:text-xs", // Padding di-adjust biar lega dikit
                        header.column.columnDef.meta?.className
                      )}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
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
                    onClick={enableSelection ? () => row.toggleSelected(!row.getIsSelected()) : undefined}
                    // REFACTOR COLORS: Gunakan semantic class (bg-muted, bg-surface) tanpa dark: manual
                    className={cx(
                      "group select-none transition-colors",
                      enableHover ? "hover:bg-muted/50" : "", // Hover color semantic
                      enableSelection ? "cursor-pointer" : "cursor-default",
                      row.getIsSelected() ? "bg-muted" : "" // Selected state semantic
                    )}
                  >
                    {row.getVisibleCells().map((cell, index) => (
                      <TableCell
                        key={cell.id}
                        className={cx(
                          "relative whitespace-nowrap py-2 text-secondary first:w-10",
                          cell.column.columnDef.meta?.className
                        )}
                      >
                        {/* Indikator Seleksi (Garis Biru di Kiri) */}
                        {index === 0 && row.getIsSelected() && (
                          <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
                        )}
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-content-subtle">
                      <svg className="size-8 text-content-placeholder" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-sm font-medium">No data available</p>
                      <p className="text-xs text-content-placeholder">Data will appear here once added</p>
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