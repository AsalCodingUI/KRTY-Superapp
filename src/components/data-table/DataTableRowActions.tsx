"use client"

import { Button } from "@/components/Button"
import { Database } from "@/lib/database.types"
import { RiMoreFill } from "@remixicon/react"
import { Row } from "@tanstack/react-table"

import { DeleteConfirmDialog, TeamFormDialog } from "@/app/(main)/teams/components/TeamDialogs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/Dropdown"
import { useState } from "react"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  // State untuk Modal Lokal
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  type Profile = Database['public']['Tables']['profiles']['Row']
  const item = row.original as Profile

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="group aspect-square p-1.5 hover:border hover:border data-[state=open]:border data-[state=open]:bg-muted hover:dark:border data-[state=open]:dark:border data-[state=open]:dark:bg-surface"
          >
            <RiMoreFill
              className="size-4 shrink-0 text-content-subtle group-hover:text-content-subtle group-data-[state=open]:text-content-subtle group-hover:dark:text-content-subtle group-data-[state=open]:dark:text-content-subtle"
              aria-hidden="true"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-32">
          {/* Tombol Edit */}
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            Edit
          </DropdownMenuItem>

          {/* Tombol Delete (Merah) */}
          <DropdownMenuItem
            className="text-danger focus:text-danger"
            onClick={() => setIsDeleteOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* MODAL EDIT */}
      {isEditOpen && (
        <TeamFormDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={item}
        />
      )}

      {/* MODAL DELETE */}
      {isDeleteOpen && (
        <DeleteConfirmDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          idsToDelete={[item.id]}
          onSuccess={() => { }} // DataTable otomatis refresh via router.refresh di dalam dialog
        />
      )}
    </>
  )
}