"use client"

import { RiArrowDownSLine, RiArrowUpSLine } from "@remixicon/react"
import { Column } from "@tanstack/react-table"

import { cx } from "@/shared/lib/utils"

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
  // Cek apakah kolom ini diizinkan untuk sorting
  const canSort = column.getCanSort()
  // Cek status sorting saat ini ('asc', 'desc', atau false)
  const isSorted = column.getIsSorted()

  // Kalau gak bisa sort, balikin teks biasa (polos) dengan height yang sama
  if (!canSort) {
    return (
      <div
        className={cx(
          "text-label-md text-content-subtle dark:text-content-subtle py-1.5",
          className,
        )}
      >
        {title}
      </div>
    )
  }

  return (
    <div
      // Handler klik untuk sorting
      onClick={column.getToggleSortingHandler()}
      className={cx(
        // Base style
        "flex items-center gap-2 py-1.5",
        // Style interaktif (kursor pointer, no hover effect)
        "cursor-pointer select-none",
        className,
      )}
    >
      <span className="text-label-md text-content-subtle dark:text-content-subtle whitespace-nowrap">
        {title}
      </span>

      {/* LOGIC ICON TUMPUK (STACKED) */}
      <div className="-space-y-2">
        <RiArrowUpSLine
          className={cx(
            "text-content-subtle dark:text-content-subtle size-3.5",
            // Kalau lagi sort DESC (Z-A), panah ATAS jadi transparan (opacity-30)
            isSorted === "desc" ? "opacity-30" : "",
          )}
          aria-hidden="true"
        />
        <RiArrowDownSLine
          className={cx(
            "text-content-subtle dark:text-content-subtle size-3.5",
            // Kalau lagi sort ASC (A-Z), panah BAWAH jadi transparan (opacity-30)
            isSorted === "asc" ? "opacity-30" : "",
          )}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
