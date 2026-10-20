"use client"

import * as React from "react"
import type { RowSelectionState, Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type BulkIds = string[] | number[]

type DataTableBulkEditorProps<TData> = {
  table: Table<TData>
  rowSelection: RowSelectionState
  onEdit?: (item: TData) => void
  onDelete?: (ids: BulkIds) => Promise<void>
  onApprove?: (ids: BulkIds) => Promise<void>
  onReject?: (ids: BulkIds) => Promise<void>
}

// ============================================================================
// Floating command bar primitives (inverted surface)
// ============================================================================

function BulkSeparator() {
  return <div aria-hidden="true" className="mx-1 h-4 w-px bg-background/20" />
}

function BulkCommand({
  label,
  action,
  shortcut,
  disabled,
}: {
  label: string
  action: () => void | Promise<void>
  shortcut: { shortcut: string; label?: string }
  disabled?: boolean
}) {
  const actionRef = React.useRef(action)
  React.useEffect(() => {
    actionRef.current = action
  }, [action])

  React.useEffect(() => {
    if (disabled) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === shortcut.shortcut) {
        event.preventDefault()
        event.stopPropagation()
        void actionRef.current()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [shortcut.shortcut, disabled])

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => void action()}
      disabled={disabled}
      aria-label={label}
      className="gap-x-1.5 text-background hover:bg-background/10 hover:text-background dark:hover:bg-background/10"
    >
      <span>{label}</span>
      <Kbd className="hidden bg-background/20 text-background sm:inline-flex">
        {(shortcut.label ?? shortcut.shortcut).toUpperCase()}
      </Kbd>
    </Button>
  )
}

// ============================================================================
// Bulk editor
// ============================================================================

function DataTableBulkEditor<TData>({
  table,
  rowSelection,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: DataTableBulkEditorProps<TData>) {
  const selectedCount = Object.keys(rowSelection).length
  const hasSelectedRows = selectedCount > 0

  const selectedRows = table.getSelectedRowModel().rows
  const selectedIds = selectedRows.map(
    (row) => (row.original as { id: string }).id,
  )

  const runBulk = async (handler?: (ids: BulkIds) => Promise<void>) => {
    if (!handler) return
    await handler(selectedIds)
    table.resetRowSelection()
  }

  return (
    <Popover open={hasSelectedRows}>
      <PopoverAnchor className="fixed inset-x-0 bottom-8 mx-auto flex w-fit items-center" />
      <PopoverContent
        side="top"
        sideOffset={0}
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={cn(
          "w-auto flex-row items-center gap-x-0.5 rounded-xl p-1 ring-0",
          "bg-foreground text-background",
        )}
      >
        <div className="px-3 py-2 text-body-sm font-medium tabular-nums">
          {selectedCount} selected
        </div>
        <BulkSeparator />

        {onEdit && selectedCount === 1 && (
          <>
            <BulkCommand
              label="Edit"
              action={() => onEdit(selectedRows[0].original)}
              shortcut={{ shortcut: "e" }}
            />
            <BulkSeparator />
          </>
        )}

        {onApprove && (
          <BulkCommand
            label="Approve"
            action={() => runBulk(onApprove)}
            shortcut={{ shortcut: "a" }}
          />
        )}

        {onReject && (
          <>
            <BulkSeparator />
            <BulkCommand
              label="Reject"
              action={() => runBulk(onReject)}
              shortcut={{ shortcut: "r" }}
            />
          </>
        )}

        {onDelete && (
          <>
            <BulkSeparator />
            <BulkCommand
              label="Delete"
              action={() => runBulk(onDelete)}
              shortcut={{ shortcut: "d" }}
            />
          </>
        )}

        <BulkSeparator />

        <BulkCommand
          label="Reset"
          action={() => table.resetRowSelection()}
          shortcut={{ shortcut: "Escape", label: "esc" }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DataTableBulkEditor }
export type { DataTableBulkEditorProps }
