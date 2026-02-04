"use client"

import { Button } from "@/components/ui";
import { Label } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { TextInput } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";

interface MilestoneItem {
    no: string;
    category: string;
    desc: string;
    time: string;
}

interface Milestones {
    m1: MilestoneItem[];
    m2: MilestoneItem[];
    m3: MilestoneItem[];
}

interface MilestonesFormProps {
    data: Milestones;
    onChange: (data: Milestones) => void;
}

export const MilestonesForm = ({ data, onChange }: MilestonesFormProps) => {

    const updateMilestone = (key: keyof Milestones, newData: MilestoneItem[]) => {
        onChange({ ...data, [key]: newData });
    };

    const addItem = (key: keyof Milestones) => {
        const currentList = data[key];
        const newItem: MilestoneItem = {
            no: (currentList.length + 1).toString() + '.',
            category: '',
            desc: '',
            time: '0'
        };
        updateMilestone(key, [...currentList, newItem]);
    };

    const updateItem = (key: keyof Milestones, index: number, field: keyof MilestoneItem, value: string) => {
        const currentList = [...data[key]];
        currentList[index] = { ...currentList[index], [field]: value };
        updateMilestone(key, currentList);
    };

    const deleteItem = (key: keyof Milestones, index: number) => {
        const currentList = data[key].filter((_, i) => i !== index);
        const reIndexed = currentList.map((item, i) => ({
            ...item,
            no: (i + 1).toString() + '.'
        }));
        updateMilestone(key, reIndexed);
    };

    const MilestoneEditor = ({ mKey, title }: { mKey: keyof Milestones, title: string }) => (
        <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-tremor-content-subtle">{title}</h4>
                <div className="text-xs text-tremor-content-subtle">
                    Total: {data[mKey].reduce((acc, item) => acc + (parseInt(item.time) || 0), 0)} Days
                </div>
            </div>

            {data[mKey].map((item, index) => (
                <div key={index} className="bg-tremor-background-muted p-4 rounded-md relative group border border-tremor-ring">
                    <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity !p-2 h-8 w-8"
                        onClick={() => deleteItem(mKey, index)}
                    >
                        <RiDeleteBinLine className="w-4 h-4" />
                    </Button>

                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-1">
                            <Label className="text-xs mb-1">No</Label>
                            <TextInput
                                value={item.no}
                                onChange={(e) => updateItem(mKey, index, 'no', e.target.value)}
                            />
                        </div>
                        <div className="col-span-4">
                            <Label className="text-xs mb-1">Category</Label>
                            <TextInput
                                value={item.category}
                                onChange={(e) => updateItem(mKey, index, 'category', e.target.value)}
                                placeholder="Type"
                            />
                        </div>
                        <div className="col-span-2">
                            <Label className="text-xs mb-1">Days</Label>
                            <div className="relative">
                                <TextInput
                                    type="number"
                                    value={item.time}
                                    onChange={(e) => updateItem(mKey, index, 'time', e.target.value)}
                                    className="pr-8"
                                />
                                <span className="absolute right-2 top-2 text-xs text-tremor-content-subtle">d</span>
                            </div>
                        </div>
                        <div className="col-span-12">
                            <Label className="text-xs mb-1">Deliverables</Label>
                            <Textarea
                                value={item.desc}
                                onChange={(e) => updateItem(mKey, index, 'desc', e.target.value)}
                                className="min-h-[60px]"
                                placeholder="- List items here..."
                            />
                        </div>
                    </div>
                </div>
            ))}

            <Button variant="secondary" onClick={() => addItem(mKey)} className="w-full border-dashed border-tremor-border hover:border-tremor-content-subtle">
                <RiAddLine className="w-4 h-4 mr-2" /> Add Deliverable
            </Button>
        </div>
    );

    return (
        <div>
            <div className="pb-4 border-b border-border-border mb-4">
                <h3 className="text-md font-semibold text-content dark:text-content">Milestones & Timeline</h3>
                <p className="text-sm text-content-muted">Define deliverables and timeline for each milestone.</p>
            </div>

            <Tabs defaultValue="m1" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
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
    );
};
