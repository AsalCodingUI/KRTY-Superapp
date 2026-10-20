"use client"

import * as React from "react"
import type { RowSelectionState, Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
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
// Floating command bar primitives
// ============================================================================

function BulkSeparator() {
  return <div aria-hidden="true" className="bg-border mx-1 h-4 w-px" />
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
      onClick={() => void action()}
      disabled={disabled}
      aria-label={label}
      className="gap-x-1.5"
    >
      <span>{label}</span>
      <Kbd className="hidden sm:inline-flex">
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
      {/* Base UI has no PopoverAnchor: an inert, empty trigger acts as the anchor. */}
      <PopoverTrigger
        nativeButton={false}
        tabIndex={-1}
        aria-hidden
        render={
          <div className="fixed inset-x-0 bottom-8 mx-auto flex w-fit items-center" />
        }
      />
      <PopoverContent
        side="top"
        sideOffset={0}
        initialFocus={false}
        className={cn(
          "w-auto flex-row items-center gap-x-0.5 rounded-xl p-1",
          "bg-popover text-popover-foreground ring-border shadow-lg ring-1",
        )}
      >
        <div className="text-muted-foreground px-3 py-2 text-sm font-medium tabular-nums">
          {selectedCount} selected
        </div>
        {[
          onEdit && selectedCount === 1 && (
            <BulkCommand
              key="edit"
              label="Edit"
              action={() => onEdit(selectedRows[0].original)}
              shortcut={{ shortcut: "e" }}
            />
          ),
          onApprove && (
            <BulkCommand
              key="approve"
              label="Approve"
              action={() => runBulk(onApprove)}
              shortcut={{ shortcut: "a" }}
            />
          ),
          onReject && (
            <BulkCommand
              key="reject"
              label="Reject"
              action={() => runBulk(onReject)}
              shortcut={{ shortcut: "r" }}
            />
          ),
          onDelete && (
            <BulkCommand
              key="delete"
              label="Delete"
              action={() => runBulk(onDelete)}
              shortcut={{ shortcut: "d" }}
            />
          ),
          <BulkCommand
            key="reset"
            label="Reset"
            action={() => table.resetRowSelection()}
            shortcut={{ shortcut: "Escape", label: "esc" }}
          />,
        ]
          .filter(Boolean)
          .map((command, index) => (
            // One separator between neighbours, never doubled.
            <React.Fragment key={index}>
              <BulkSeparator />
              {command}
            </React.Fragment>
          ))}
      </PopoverContent>
    </Popover>
  )
}

export { DataTableBulkEditor }
export type { DataTableBulkEditorProps }
