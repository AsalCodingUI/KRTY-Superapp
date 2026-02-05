"use client"

import { Button } from "@/shared/ui/action/Button"
import { Checkbox } from "@/shared/ui/input/Checkbox"
import { Label } from "@/shared/ui/input/Label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/overlay/Popover"
import { cx } from "@/shared/lib/utils"
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { RiDraggable, RiEqualizer2Line } from "@/shared/ui/lucide-icons"
import { Table } from "@tanstack/react-table"
import { useEffect, useState } from "react"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

type Item = {
  id: string
  label: string
}

function SortableItem({ item, table }: { item: Item; table: Table<any> }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  }

  const column = table.getColumn(item.id)
  if (!column || !column.getCanHide()) return null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative border-b border-transparent"
    >
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
          />
          <span className="text-body-sm">{item.label}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="-mr-1 cursor-grab px-0 py-1 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${item.label}`}
        >
          <RiDraggable className="text-content-placeholder dark:text-content-subtle size-5" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Column visibility and ordering options for DataTable.
 */
function ViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  // Initialize items from table columns
  const [items, setItems] = useState<Item[]>(() =>
    table.getAllColumns().map((column) => ({
      id: column.id,
      label: (column.columnDef.meta as any)?.displayName || column.id,
    })),
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    // Re-sync with table columns if they change substantially,
    // though typically in this setup we drive table order via items.
    // But initially we want to make sure we have all columns.
    // For this refactor, we stick to the provided logic of mapping initial columns.
  }, [])

  // Sync column order to table when items change
  useEffect(() => {
    table.setColumnOrder(items.map((item) => item.id))
  }, [items, table])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  return (
    <div>
      <div className="flex justify-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="default"
              className={cx("ml-auto hidden gap-x-2 lg:flex")}
            >
              <RiEqualizer2Line className="size-4" aria-hidden="true" />
              View
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={7}
            className="z-50 w-fit space-y-2 p-4"
          >
            <Label className="mb-3 block font-medium">Display properties</Label>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {items.map((item) => (
                    <SortableItem key={item.id} item={item} table={table} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

export { ViewOptions }
