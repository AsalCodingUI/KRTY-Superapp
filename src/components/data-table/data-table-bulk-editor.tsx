"use client"

import * as React from "react"
import type { RowSelectionState, Table } from "@tanstack/react-table"

import { Ban, Check, Pencil, Trash2, X } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"

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
// Floating command bar primitives (dark pill, icon buttons)
// ============================================================================

function BulkSeparator() {
  return <div aria-hidden="true" className="mx-0.5 h-4 w-px bg-white/15" />
}

function BulkCommand({
  label,
  icon,
  action,
  shortcut,
  disabled,
  tone,
}: {
  label: string
  icon: React.ReactNode
  action: () => void | Promise<void>
  shortcut: { shortcut: string; label?: string }
  disabled?: boolean
  tone?: "danger"
}) {
  const actionRef = React.useRef(action)
  React.useEffect(() => {
    actionRef.current = action
  }, [action])

  React.useEffect(() => {
    if (disabled) return
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, [contenteditable=true]")) return
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
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={() => void action()}
            disabled={disabled}
            aria-label={label}
            className={cn(
              "flex size-8 cursor-pointer items-center justify-center rounded-full text-white/80 transition-[background-color,color,scale] duration-150 ease-out outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
              tone === "danger" && "hover:text-red-9",
            )}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>
        {label}{" "}
        <span className="opacity-60">
          {(shortcut.label ?? shortcut.shortcut).toUpperCase()}
        </span>
      </TooltipContent>
    </Tooltip>
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
  const t = useT("shell")
  const tc = useT("common")
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
          "w-auto flex-row items-center gap-x-0.5 rounded-full p-1",
          // Rises in from below with a slight scale, sinks back out.
          "data-[side=top]:slide-in-from-bottom-4 data-open:zoom-in-[0.96] data-closed:slide-out-to-bottom-4 data-closed:zoom-out-[0.96] duration-200",
          "bg-inverse text-white shadow-lg ring-1 ring-white/10",
        )}
      >
        <span className="pr-1 pl-3 text-sm text-white/70 tabular-nums">
          {t("dataTableSelected", { count: selectedCount })}
        </span>
        {[
          onEdit && selectedCount === 1 && (
            <BulkCommand
              key="edit"
              label={tc("edit")}
              icon={<Pencil />}
              action={() => onEdit(selectedRows[0].original)}
              shortcut={{ shortcut: "e" }}
            />
          ),
          onApprove && (
            <BulkCommand
              key="approve"
              label={t("dataTableApprove")}
              icon={<Check />}
              action={() => runBulk(onApprove)}
              shortcut={{ shortcut: "a" }}
            />
          ),
          onReject && (
            <BulkCommand
              key="reject"
              label={t("dataTableReject")}
              icon={<Ban />}
              action={() => runBulk(onReject)}
              shortcut={{ shortcut: "r" }}
            />
          ),
          onDelete && (
            <BulkCommand
              key="delete"
              label={tc("delete")}
              icon={<Trash2 />}
              tone="danger"
              action={() => runBulk(onDelete)}
              shortcut={{ shortcut: "d" }}
            />
          ),
        ].filter(Boolean)}
        <BulkSeparator />
        <BulkCommand
          label={t("dataTableClearSelection")}
          icon={<X />}
          action={() => table.resetRowSelection()}
          shortcut={{ shortcut: "Escape", label: "esc" }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DataTableBulkEditor }
export type { DataTableBulkEditorProps }
