"use client"

import { Button, Label, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, TextInput } from "@/shared/ui"
import { RiAddLine, RiDeleteBinLine } from "@/shared/ui/lucide-icons"

interface MilestoneItem {
  no: string
  category: string
  desc: string
  time: string
}

interface Milestones {
  m1: MilestoneItem[]
  m2: MilestoneItem[]
  m3: MilestoneItem[]
}

interface MilestonesFormProps {
  data: Milestones
  onChange: (data: Milestones) => void
}

export const MilestonesForm = ({ data, onChange }: MilestonesFormProps) => {
  const updateMilestone = (key: keyof Milestones, newData: MilestoneItem[]) => {
    onChange({ ...data, [key]: newData })
  }

  const addItem = (key: keyof Milestones) => {
    const currentList = data[key]
    const newItem: MilestoneItem = {
      no: (currentList.length + 1).toString() + ".",
      category: "",
      desc: "",
      time: "0",
    }
    updateMilestone(key, [...currentList, newItem])
  }

  const updateItem = (
    key: keyof Milestones,
    index: number,
    field: keyof MilestoneItem,
    value: string,
  ) => {
    const currentList = [...data[key]]
    currentList[index] = { ...currentList[index], [field]: value }
    updateMilestone(key, currentList)
  }

  const deleteItem = (key: keyof Milestones, index: number) => {
    const currentList = data[key].filter((_, i) => i !== index)
    const reIndexed = currentList.map((item, i) => ({
      ...item,
      no: (i + 1).toString() + ".",
    }))
    updateMilestone(key, reIndexed)
  }

  const MilestoneEditor = ({
    mKey,
    title,
  }: {
    mKey: keyof Milestones
    title: string
  }) => (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-label-md text-foreground-primary">{title}</h4>
        <div className="text-label-xs text-foreground-secondary">
          Total:{" "}
          {data[mKey].reduce(
            (acc, item) => acc + (parseInt(item.time) || 0),
            0,
          )}{" "}
          Days
        </div>
      </div>

      {data[mKey].map((item, index) => (
        <div
          key={index}
          className="bg-surface-neutral-primary border-neutral-primary group relative rounded-md border p-4"
        >
          <Button
            variant="ghost"
            size="xs"
            className="text-foreground-tertiary absolute top-2 right-2 h-8 w-8 p-0"
            onClick={() => deleteItem(mKey, index)}
          >
            <RiDeleteBinLine className="h-4 w-4" />
          </Button>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-2 lg:col-span-1">
              <Label className="mb-1">No</Label>
              <TextInput
                value={item.no}
                onChange={(e) => updateItem(mKey, index, "no", e.target.value)}
              />
            </div>
            <div className="md:col-span-6 lg:col-span-5">
              <Label className="mb-1">Category</Label>
              <TextInput
                value={item.category}
                onChange={(e) =>
                  updateItem(mKey, index, "category", e.target.value)
                }
                placeholder="Type"
              />
            </div>
            <div className="md:col-span-4 lg:col-span-2">
              <Label className="mb-1">Days</Label>
              <div className="relative">
                <TextInput
                  type="number"
                  value={item.time}
                  onChange={(e) =>
                    updateItem(mKey, index, "time", e.target.value)
                  }
                  className="pr-8"
                />
                <span className="text-body-xs text-foreground-secondary absolute top-2 right-2">
                  d
                </span>
              </div>
            </div>
            <div className="md:col-span-12">
              <Label className="mb-1">Deliverables</Label>
              <Textarea
                value={item.desc}
                onChange={(e) =>
                  updateItem(mKey, index, "desc", e.target.value)
                }
                className="min-h-[60px]"
                placeholder="- List items here..."
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        variant="secondary"
        onClick={() => addItem(mKey)}
        className="border-neutral-primary hover:border-foreground-tertiary w-full border-dashed"
      >
        <RiAddLine className="mr-2 h-4 w-4" /> Add Deliverable
      </Button>
    </div>
  )

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-label-md text-foreground-primary">
          Milestones & Timeline
        </h3>
      </div>

      <Tabs defaultValue="m1" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="m1">Milestone 1</TabsTrigger>
          <TabsTrigger value="m2">Milestone 2</TabsTrigger>
          <TabsTrigger value="m3">Milestone 3</TabsTrigger>
        </TabsList>
        <TabsContent value="m1">
          <MilestoneEditor mKey="m1" title="Style Guide & Initial Wireframes" />
        </TabsContent>
        <TabsContent value="m2">
          <MilestoneEditor mKey="m2" title="High-Fidelity UI Design" />
        </TabsContent>
        <TabsContent value="m3">
          <MilestoneEditor mKey="m3" title="Prototype & Final Adjustments" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
