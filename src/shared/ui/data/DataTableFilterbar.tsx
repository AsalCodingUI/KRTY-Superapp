"use client"

import { Button, TextInput } from "@/components/ui"
import { RiAddLine, RiDownloadLine } from "@/shared/ui/lucide-icons"
import { Table } from "@tanstack/react-table"
import { useState } from "react"
import { useDebouncedCallback } from "use-debounce"
import { ViewOptions } from "./DataTableViewOptions"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onCreate?: () => void
  showExport?: boolean
  showViewOptions?: boolean
  actionLabel?: string
  searchKey?: string // 1. Tambah Props Baru
}

export function Filterbar<TData>({
  table,
  onCreate,
  showExport = true,
  showViewOptions = true,
  actionLabel = "Add Member",
  searchKey, // 2. Ambil Props
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [searchTerm, setSearchTerm] = useState<string>("")

  // 3. LOGIC PENCARIAN YANG LEBIH AMAN
  // Jika searchKey diberikan, pakai itu. Jika tidak, baru fallback ke tebak-tebakan lama (biar aman).
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
            className="border-border text-primary border px-2 font-semibold sm:border-none sm:py-1"
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
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

        {showViewOptions && <ViewOptions table={table} />}

        {onCreate && (
          <Button onClick={onCreate} size="default" className="gap-x-2">
            <RiAddLine className="size-4 shrink-0" aria-hidden="true" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
