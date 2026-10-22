"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import type { Table } from "@tanstack/react-table"
import { Download as DownloadIcon, Plus as PlusIcon } from "@/components/icons"
import { useDebouncedCallback } from "use-debounce"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// View options pull in @dnd-kit; load only when a table actually shows them.
const DataTableViewOptions = dynamic(
  () => import("./data-table-view-options").then((m) => m.DataTableViewOptions)
) as typeof import("./data-table-view-options").DataTableViewOptions

interface DataTableFilterbarProps<TData> {
  table: Table<TData>
  onCreate?: () => void
  showExport?: boolean
  showViewOptions?: boolean
  actionLabel?: string
  /** Column id used for the search box */
  searchKey?: string
}

export function DataTableFilterbar<TData>({
  table,
  onCreate,
  showExport = true,
  showViewOptions = false,
  actionLabel = "Add Member",
  searchKey,
}: DataTableFilterbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [searchTerm, setSearchTerm] = React.useState<string>("")

  // Prefer explicit searchKey; fall back to the legacy guesses.
  const searchColumn = searchKey
    ? table.getColumn(searchKey)
    : table.getColumn("full_name") ||
      table.getColumn("owner") ||
      table.getColumn("leave_type")

  const debouncedSetFilterValue = useDebouncedCallback((value: string) => {
    searchColumn?.setFilterValue(value)
  }, 300)

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchTerm(value)
    debouncedSetFilterValue(value)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-x-6">
      <div className="flex w-full flex-col gap-2 sm:w-fit sm:flex-row sm:items-center">
        {searchColumn && (
          <Input
            type="search"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full sm:max-w-[250px]"
          />
        )}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters()
              setSearchTerm("")
            }}
            className="border-border text-primary border px-2 font-semibold sm:border-none"
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showExport && (
          <Button variant="outline" className="hidden lg:inline-flex">
            <DownloadIcon data-icon="inline-start" aria-hidden="true" />
            Export
          </Button>
        )}

        {showViewOptions && <DataTableViewOptions table={table} />}

        {onCreate && (
          <Button onClick={onCreate}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

/** Legacy alias */
const Filterbar = DataTableFilterbar

export { Filterbar }
export type { DataTableFilterbarProps }
