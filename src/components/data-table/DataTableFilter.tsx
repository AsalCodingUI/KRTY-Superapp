"use client"

import { Button } from "@/components/Button"
import { Searchbar } from "@/components/Searchbar"
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
}

export function Filterbar<TData>({
  table,
  onCreate,
  showExport = true, // Default muncul
  showViewOptions = true, // Default muncul
  actionLabel = "Add Member" // Default text
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Otomatis cari kolom yang bisa disearch (leave_type, reason, full_name, dll)
  const searchColumn = table.getColumn("full_name") || table.getColumn("owner") || table.getColumn("leave_type")

  const debouncedSetFilterValue = useDebouncedCallback((value) => {
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
          <Searchbar
            type="search"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full sm:max-w-[250px] sm:[&>input]:h-[30px]"
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
            className="hidden gap-x-2 px-2 py-1.5 text-sm sm:text-xs lg:flex"
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
            className="gap-x-2 px-2 py-1.5 text-sm sm:text-xs"
          >
            <RiAddLine className="size-4 shrink-0" aria-hidden="true" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}