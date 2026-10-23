"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useT } from "@/shared/i18n/client"
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
  const t = useT("sla")
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
        <h4 className="text-foreground text-sm font-medium">{title}</h4>
        <div className="text-muted-foreground text-xs font-medium">
          {t("milestoneTotalDays", {
            n: data[mKey].reduce(
              (acc, item) => acc + (parseInt(item.time) || 0),
              0,
            ),
          })}
        </div>
      </div>

      {data[mKey].map((item, index) => (
        <div
          key={index}
          className="group relative border-b py-4 last:border-b-0"
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-tertiary-foreground absolute top-2 right-2"
            onClick={() => deleteItem(mKey, index)}
          >
            <RiDeleteBinLine className="h-4 w-4" />
          </Button>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-2 lg:col-span-1">
              <Label className="mb-1">{t("fieldNo")}</Label>
              <Input
                value={item.no}
                onChange={(e) => updateItem(mKey, index, "no", e.target.value)}
              />
            </div>
            <div className="md:col-span-6 lg:col-span-5">
              <Label className="mb-1">{t("category")}</Label>
              <Input
                value={item.category}
                onChange={(e) =>
                  updateItem(mKey, index, "category", e.target.value)
                }
                placeholder={t("categoryPlaceholder")}
              />
            </div>
            <div className="md:col-span-4 lg:col-span-2">
              <Label className="mb-1">{t("days")}</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={item.time}
                  onChange={(e) =>
                    updateItem(mKey, index, "time", e.target.value)
                  }
                  className="pr-8"
                />
                <span className="text-muted-foreground absolute top-2 right-2 text-xs">
                  {t("daysSuffix")}
                </span>
              </div>
            </div>
            <div className="md:col-span-12">
              <Label className="mb-1">{t("deliverables")}</Label>
              <Textarea
                value={item.desc}
                onChange={(e) =>
                  updateItem(mKey, index, "desc", e.target.value)
                }
                className="min-h-[60px]"
                placeholder={t("deliverablesPlaceholder")}
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        onClick={() => addItem(mKey)}
        className="border-border hover:border-muted-foreground/70 w-full border-dashed"
      >
        <RiAddLine data-icon="inline-start" /> {t("addDeliverable")}
      </Button>
    </div>
  )

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-foreground text-sm font-medium">
          {t("milestonesTitle")}
        </h3>
      </div>

      <Tabs defaultValue="m1" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="m1">{t("milestoneTab", { n: 1 })}</TabsTrigger>
          <TabsTrigger value="m2">{t("milestoneTab", { n: 2 })}</TabsTrigger>
          <TabsTrigger value="m3">{t("milestoneTab", { n: 3 })}</TabsTrigger>
        </TabsList>
        <TabsContent value="m1">
          <MilestoneEditor mKey="m1" title={t("milestone1Title")} />
        </TabsContent>
        <TabsContent value="m2">
          <MilestoneEditor mKey="m2" title={t("milestone2Title")} />
        </TabsContent>
        <TabsContent value="m3">
          <MilestoneEditor mKey="m3" title={t("milestone3Title")} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
