"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Table } from "@tanstack/react-table"
import {
  GripVertical as GripVerticalIcon,
  SlidersHorizontal as Settings2Icon,
} from "@/components/icons"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

type Item = {
  id: string
  label: string
}

function SortableItem<TData>({
  item,
  table,
}: {
  item: Item
  table: Table<TData>
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  }

  const column = table.getColumn(item.id)
  if (!column || !column.getCanHide()) return null

  const checkboxId = `view-option-${item.id}`

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id={checkboxId}
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
          />
          <label htmlFor={checkboxId} className="text-sm">
            {item.label}
          </label>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="-mr-1 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${item.label}`}
        >
          <GripVerticalIcon className="text-muted-foreground size-4" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Column visibility and ordering options for DataTable.
 */
function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const [items, setItems] = React.useState<Item[]>(() =>
    table.getAllColumns().map((column) => ({
      id: column.id,
      label: column.columnDef.meta?.displayName || column.id,
    })),
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Sync column order to table when items change
  React.useEffect(() => {
    table.setColumnOrder(items.map((item) => item.id))
  }, [items, table])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((current) => {
        const oldIndex = current.findIndex((item) => item.id === active.id)
        const newIndex = current.findIndex((item) => item.id === over.id)
        return arrayMove(current, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="flex justify-center">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="ml-auto hidden lg:inline-flex"
            />
          }
        >
          <Settings2Icon data-icon="inline-start" aria-hidden="true" />
          View
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={7} className="w-fit gap-2 p-4">
          <Label className="mb-1 block font-medium">Display properties</Label>
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
  )
}

/** Legacy alias */
const ViewOptions = DataTableViewOptions

export { DataTableViewOptions, ViewOptions }
export type { DataTableViewOptionsProps }
