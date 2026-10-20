"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  RiAddLine,
  RiDeleteBinLine,
  RiDraggable,
  RiFileCopyLine,
  RiUploadLine,
} from "@/shared/ui/lucide-icons"
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
      className={`bg-card border-border group relative rounded-md border p-4 ${isDragging ? "shadow-regular-md z-50" : ""}`}
    >
      <Accordion
        defaultValue={["description"]}
        className="space-y-0 overflow-visible rounded-none border-0"
      >
        <AccordionItem
          value="description"
          className="border-none bg-transparent data-open:bg-transparent"
        >
          <div className="mb-3 flex items-center justify-between">
            <div
              {...attributes}
              {...listeners}
              className="hover:bg-accent text-muted-foreground/70 cursor-grab rounded p-1 transition-colors active:cursor-grabbing"
              title="Drag to reorder"
            >
              <RiDraggable className="h-5 w-5" />
            </div>

            <div className="flex items-center gap-1">
              <AccordionTrigger className="text-label-sm text-muted-foreground hover:text-foreground w-auto flex-none items-center gap-1 rounded-md px-2 py-1 hover:no-underline">
                Description
              </AccordionTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground/70"
                onClick={() => deleteItem(index)}
              >
                <RiDeleteBinLine className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-2 md:col-span-1">
              <Label className="mb-1">No</Label>
              <Input
                className="h-7"
                value={item.no}
                onChange={(e) => updateItem(index, "no", e.target.value)}
              />
            </div>
            <div className="sm:col-span-4 md:col-span-3">
              <Label className="mb-1">Category</Label>
              <Input
                className="h-7"
                value={item.category}
                onChange={(e) => updateItem(index, "category", e.target.value)}
                placeholder="Category"
              />
            </div>
            <div className="sm:col-span-12 md:col-span-8">
              <Label className="mb-1">Page/Flow</Label>
              <Input
                className="h-7"
                value={item.flow}
                onChange={(e) => updateItem(index, "flow", e.target.value)}
                placeholder="e.g. Login Screen"
              />
            </div>
          </div>

          <AccordionContent className="-mx-4 pt-3 pb-0">
            <Label className="mb-1">Description</Label>
            <Textarea
              value={item.desc}
              onChange={(e) => updateItem(index, "desc", e.target.value)}
              placeholder="Detail description..."
              className="min-h-[80px]"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-label-md text-foreground">Scope of Work</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <RiUploadLine data-icon="inline-start" /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <RiFileCopyLine data-icon="inline-start" /> Copy JSON
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
          variant="outline"
          size="sm"
          onClick={addItem}
          className="border-border hover:border-muted-foreground/70 w-full border-dashed"
        >
          <RiAddLine data-icon="inline-start" /> Add Item
        </Button>
      </div>
    </div>
  )
}
