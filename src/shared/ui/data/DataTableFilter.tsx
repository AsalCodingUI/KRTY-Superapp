"use client"

import { Button, TextInput } from '@/components/ui'
import { RiAddLine, RiDownloadLine } from "@remixicon/react"
import { Table } from "@tanstack/react-table"
import { useState } from "react"
import { useDebouncedCallback } from "use-debounce"
import { ViewOptions } from "./DataTableViewOptions"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onCreate?: () => void
  // Props Baru
  showExport?: boolean
  showViewOptions?: boolean
  actionLabel?: string
  searchKey?: string
}

/**
 * Toolbar for DataTable containing search, filters, view options, and actions.
 */
export function DataTableToolbar<TData>({
  table,
  onCreate,
  showExport = true, // Default muncul
  showViewOptions = true, // Default muncul
  actionLabel = "Add Member", // Default text
  searchKey // Add searchKey prop
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Use searchKey if provided, otherwise fallback to common column names
  const searchColumn = searchKey
    ? table.getColumn(searchKey)
    : (table.getColumn("full_name") || table.getColumn("owner") || table.getColumn("leave_type"))

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
        {/* SEARCH BAR (Pengganti Title) */}
        {searchColumn && (
          <TextInput
            type="search"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            inputSize="lg"
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
            className="border border-border px-2 font-semibold text-primary sm:border-none sm:py-1"
          >
            Clear filters
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* BUTTON EXPORT (Kondisional) */}
        {showExport && (
          <Button
            variant="secondary"
            size="default"
            className="hidden gap-x-2 lg:flex"
          >
            <RiDownloadLine className="size-4 shrink-0" aria-hidden="true" />
            Export
          </Button>
        )}

        {/* BUTTON VIEW (Kondisional) */}
        {showViewOptions && (
          <ViewOptions table={table} />
        )}

        {/* BUTTON ACTION (Custom Label) */}
        {onCreate && (
          <Button
            onClick={onCreate}
            size="default"
            className="gap-x-2"
          >
            <RiAddLine className="size-4 shrink-0" aria-hidden="true" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}