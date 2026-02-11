"use client"

import { Button } from "@/components/ui"
import { Label } from "@/components/ui"
import { TextInput } from "@/components/ui"
import { Textarea } from "@/components/ui"
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
import {
  RiAddLine,
  RiDeleteBinLine,
  RiDraggable,
  RiFileCopyLine,
  RiUploadLine,
} from "@/shared/ui/lucide-icons"
import { toast } from "sonner"

interface ScopeItem {
  no: string
  category: string
  flow: string
  desc: string
}

interface ScopeOfWorkFormProps {
  data: ScopeItem[]
  onChange: (data: ScopeItem[]) => void
}

// Sortable Item Component
function SortableItem({
  item,
  index,
  updateItem,
  deleteItem,
}: {
  item: ScopeItem
  index: number
  updateItem: (index: number, field: keyof ScopeItem, value: string) => void
  deleteItem: (index: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index.toString() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-tremor-background-muted group border-tremor-ring relative rounded-md border p-4 ${isDragging ? "shadow-md-border z-50" : ""}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="hover:bg-tremor-background-subtle absolute top-2 left-2 cursor-grab rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        title="Drag to reorder"
      >
        <RiDraggable className="text-foreground-tertiary h-5 w-5" />
      </div>

      {/* Delete Button */}
      <Button
        variant="destructive"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 !p-2 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => deleteItem(index)}
      >
        <RiDeleteBinLine className="h-4 w-4" />
      </Button>

      <div className="grid grid-cols-12 gap-4 pl-8">
        <div className="col-span-1">
          <Label className="text-body-xs mb-1">No</Label>
          <TextInput
            value={item.no}
            onChange={(e) => updateItem(index, "no", e.target.value)}
            className=""
          />
        </div>
        <div className="col-span-3">
          <Label className="text-body-xs mb-1">Category</Label>
          <TextInput
            value={item.category}
            onChange={(e) => updateItem(index, "category", e.target.value)}
            placeholder="Category"
          />
        </div>
        <div className="col-span-8">
          <Label className="text-body-xs mb-1">Page/Flow</Label>
          <TextInput
            value={item.flow}
            onChange={(e) => updateItem(index, "flow", e.target.value)}
            placeholder="e.g. Login Screen"
          />
        </div>
        <div className="col-span-12">
          <Label className="text-body-xs mb-1">Description</Label>
          <Textarea
            value={item.desc}
            onChange={(e) => updateItem(index, "desc", e.target.value)}
            placeholder="Detail description..."
            className="min-h-[60px]"
          />
        </div>
      </div>
    </div>
  )
}

export const ScopeOfWorkForm = ({ data, onChange }: ScopeOfWorkFormProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id as string)
      const newIndex = parseInt(over.id as string)

      const newData = arrayMove(data, oldIndex, newIndex)
      // Re-index after reordering
      const reIndexed = newData.map((item, i) => ({
        ...item,
        no: (i + 1).toString() + ".",
      }))
      onChange(reIndexed)
      toast.success("Item diurutkan")
    }
  }

  const addItem = () => {
    const newItem: ScopeItem = {
      no: (data.length + 1).toString() + ".",
      category: "",
      flow: "",
      desc: "",
    }
    onChange([...data, newItem])
  }

  const updateItem = (index: number, field: keyof ScopeItem, value: string) => {
    const newData = [...data]
    newData[index] = { ...newData[index], [field]: value }
    onChange(newData)
  }

  const deleteItem = (index: number) => {
    const newData = data.filter((_, i) => i !== index)
    // Re-index
    const reIndexed = newData.map((item, i) => ({
      ...item,
      no: (i + 1).toString() + ".",
    }))
    onChange(reIndexed)
  }

  // JSON Import/Export
  const handleExport = () => {
    const jsonString = JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(jsonString)
    toast.success("JSON tersalin")
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json"
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string)
          if (Array.isArray(parsed)) {
            onChange(parsed)
            toast.success("Scope dimuat")
          } else {
            toast.error("Format JSON salah")
          }
        } catch (error) {
          toast.error("Gagal parse JSON")
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex flex-row items-center justify-between">
        <h3 className="text-md text-foreground-primary dark:text-foreground-primary font-semibold">
          Scope of Work
        </h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleImport}>
            <RiUploadLine className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <RiFileCopyLine className="mr-2 h-4 w-4" /> Copy JSON
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={data.map((_, index) => index.toString())}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {data.map((item, index) => (
                <SortableItem
                  key={index}
                  item={item}
                  index={index}
                  updateItem={updateItem}
                  deleteItem={deleteItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button
          variant="secondary"
          onClick={addItem}
          className="border-tremor-border hover:border-tremor-content-subtle w-full border-dashed"
        >
          <RiAddLine className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>
    </div>
  )
}
