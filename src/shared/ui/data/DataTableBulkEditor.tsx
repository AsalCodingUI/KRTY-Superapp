"use client"

import {
  CommandBar,
  CommandBarBar,
  CommandBarCommand,
  CommandBarSeperator,
  CommandBarValue,
} from "@/shared/ui/navigation/CommandBar"
import { RowSelectionState, Table } from "@tanstack/react-table"

// HAPUS IMPORT INI KARENA HARDCODED KE TEAMS
// import { DeleteConfirmDialog } from '@/app/(main)/teams/components/TeamDialogs'

type DataTableBulkEditorProps<TData> = {
  table: Table<TData>
  rowSelection: RowSelectionState
  onEdit?: (item: TData) => void
  onDelete?: (ids: string[] | number[]) => Promise<void>
  onApprove?: (ids: string[] | number[]) => Promise<void>
  onReject?: (ids: string[] | number[]) => Promise<void>
}

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

  // HAPUS STATE LOKAL UNTUK DIALOG
  // const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const selectedRows = table.getSelectedRowModel().rows
  const selectedIds = selectedRows.map(
    (row) => (row.original as { id: string }).id,
  )

  // Handler baru yang generic
  const handleBulkDelete = async () => {
    if (onDelete) {
      await onDelete(selectedIds)
      table.resetRowSelection()
    }
  }

  const handleBulkApprove = async () => {
    if (onApprove) {
      await onApprove(selectedIds)
      table.resetRowSelection()
    }
  }

  const handleBulkReject = async () => {
    if (onReject) {
      await onReject(selectedIds)
      table.resetRowSelection()
    }
  }

  return (
    <>
      <CommandBar open={hasSelectedRows}>
        <CommandBarBar>
          <CommandBarValue>{selectedCount} selected</CommandBarValue>
          <CommandBarSeperator />

          {onEdit && selectedCount === 1 && (
            <>
              <CommandBarCommand
                label="Edit"
                action={() => {
                  const item = selectedRows[0].original
                  onEdit(item)
                }}
                shortcut={{ shortcut: "e" }}
              />
              <CommandBarSeperator />
            </>
          )}

          {onApprove && (
            <CommandBarCommand
              label="Approve"
              action={handleBulkApprove}
              shortcut={{ shortcut: "a" }}
            />
          )}

          {onReject && (
            <>
              <CommandBarSeperator />
              <CommandBarCommand
                label="Reject"
                action={handleBulkReject}
                shortcut={{ shortcut: "r" }}
              />
            </>
          )}

          {onDelete && (
            <>
              <CommandBarSeperator />
              <CommandBarCommand
                label="Delete"
                action={handleBulkDelete}
                shortcut={{ shortcut: "d" }}
              />
            </>
          )}

          <CommandBarSeperator />

          <CommandBarCommand
            label="Reset"
            action={() => table.resetRowSelection()}
            shortcut={{ shortcut: "Escape", label: "esc" }}
          />
        </CommandBarBar>
      </CommandBar>
    </>
  )
}

export { DataTableBulkEditor }
