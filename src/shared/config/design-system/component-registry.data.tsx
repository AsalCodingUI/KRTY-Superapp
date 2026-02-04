/**
 * Component Registry Data
 *
 * This file contains the complete registry of all UI components
 * organized into categories for the design system showcase.
 */

import React from "react"
import type { ComponentRegistry } from "./component-registry.types"

/**
 * The complete component registry with all 35+ components
 * organized into 7 categories
 */
export const componentRegistry: ComponentRegistry = {
  categories: [
    {
      id: "buttons-actions",
      name: "Buttons & Actions",
      description: "Interactive elements for user actions and state changes",
      components: [
        {
          id: "button",
          name: "Button",
          description: "Primary action button with multiple variants and sizes",
          importPath: "@/components/ui/Button",
          variants: [
            {
              name: "Primary",
              description: "Default primary button style",
              props: { variant: "primary", children: "Primary Button" },
              preview: React.createElement(
                "button",
                { className: "btn-primary" },
                "Primary Button",
              ),
            },
            {
              name: "Secondary",
              description: "Secondary button style for less prominent actions",
              props: { variant: "secondary", children: "Secondary Button" },
              preview: React.createElement(
                "button",
                { className: "btn-secondary" },
                "Secondary Button",
              ),
            },
            {
              name: "Destructive",
              description: "Destructive action button (delete, remove)",
              props: { variant: "destructive", children: "Delete" },
              preview: React.createElement(
                "button",
                { className: "btn-destructive" },
                "Delete",
              ),
            },
          ],
          props: [
            {
              name: "variant",
              type: '"primary" | "secondary" | "destructive" | "ghost"',
              required: false,
              default: "primary",
              description: "Visual style variant",
            },
            {
              name: "size",
              type: '"sm" | "md" | "lg"',
              required: false,
              default: "md",
              description: "Button size",
            },
            {
              name: "disabled",
              type: "boolean",
              required: false,
              default: false,
              description: "Whether button is disabled",
            },
            {
              name: "children",
              type: "React.ReactNode",
              required: true,
              description: "Button content",
            },
          ],
          examples: [
            {
              title: "Basic Usage",
              description: "Simple button with text",
              code: `import { Button } from '@/components/ui'\n\n<Button>Click me</Button>`,
              preview: React.createElement("button", {}, "Click me"),
            },
          ],
          relatedComponents: ["toggle", "switch"],
        },
        {
          id: "toggle",
          name: "Toggle",
          description: "Toggle switch for binary on/off states",
          importPath: "@/components/ui/Toggle",
          variants: [
            {
              name: "Default",
              description: "Standard toggle switch",
              props: { checked: false },
              preview: React.createElement(
                "div",
                { className: "toggle" },
                "Toggle",
              ),
            },
          ],
          props: [
            {
              name: "checked",
              type: "boolean",
              required: false,
              default: false,
              description: "Whether toggle is checked",
            },
            {
              name: "onChange",
              type: "(checked: boolean) => void",
              required: false,
              description: "Callback when toggle changes",
            },
            {
              name: "disabled",
              type: "boolean",
              required: false,
              default: false,
              description: "Whether toggle is disabled",
            },
          ],
          examples: [
            {
              title: "Basic Toggle",
              description: "Simple toggle switch",
              code: `import { Toggle } from '@/components/ui'\n\n<Toggle checked={enabled} onChange={setEnabled} />`,
              preview: React.createElement("div", {}, "Toggle"),
            },
          ],
          relatedComponents: ["button", "switch", "checkbox"],
        },
        {
          id: "switch",
          name: "Switch",
          description: "Switch component for toggling settings",
          importPath: "@/components/ui/Switch",
          variants: [
            {
              name: "Default",
              description: "Standard switch",
              props: { checked: false },
              preview: React.createElement(
                "div",
                { className: "switch" },
                "Switch",
              ),
            },
          ],
          props: [
            {
              name: "checked",
              type: "boolean",
              required: false,
              default: false,
              description: "Whether switch is checked",
            },
            {
              name: "onCheckedChange",
              type: "(checked: boolean) => void",
              required: false,
              description: "Callback when switch changes",
            },
            {
              name: "disabled",
              type: "boolean",
              required: false,
              default: false,
              description: "Whether switch is disabled",
            },
          ],
          examples: [
            {
              title: "Basic Switch",
              description: "Simple switch component",
              code: `import { Switch } from '@/components/ui'\n\n<Switch checked={enabled} onCheckedChange={setEnabled} />`,
              preview: React.createElement("div", {}, "Switch"),
            },
          ],
          relatedComponents: ["toggle", "checkbox"],
        },
      ],
    },
    {
      id: "form-inputs",
      name: "Form Inputs",
      description: "Input components for forms and data entry",
      components: [
        {
          id: "text-input",
          name: "TextInput",
          description: "Single-line text input field",
          importPath: "@/components/ui/TextInput",
          variants: [
            {
              name: "Default",
              description: "Standard text input",
              props: { placeholder: "Enter text..." },
              preview: React.createElement("input", {
                type: "text",
                placeholder: "Enter text...",
              }),
            },
          ],
          props: [
            {
              name: "value",
              type: "string",
              required: false,
              description: "Input value",
            },
            {
              name: "onChange",
              type: "(e: ChangeEvent) => void",
              required: false,
              description: "Change handler",
            },
            {
              name: "placeholder",
              type: "string",
              required: false,
              description: "Placeholder text",
            },
            {
              name: "disabled",
              type: "boolean",
              required: false,
              default: false,
              description: "Whether input is disabled",
            },
            {
              name: "error",
              type: "boolean",
              required: false,
              default: false,
              description: "Whether input has error",
            },
          ],
          examples: [
            {
              title: "Basic Input",
              description: "Simple text input",
              code: `import { TextInput } from '@/components/ui'\n\n<TextInput placeholder="Enter name" />`,
              preview: React.createElement("input", { type: "text" }),
            },
          ],
          relatedComponents: ["textarea", "select"],
        },
        {
          id: "textarea",
          name: "Textarea",
          description: "Multi-line text input field",
          importPath: "@/components/ui/Textarea",
          variants: [
            {
              name: "Default",
              description: "Standard textarea",
              props: { placeholder: "Enter text..." },
              preview: React.createElement("textarea", {
                placeholder: "Enter text...",
              }),
            },
          ],
          props: [
            {
              name: "value",
              type: "string",
              required: false,
              description: "Textarea value",
            },
            {
              name: "onChange",
              type: "(e: ChangeEvent) => void",
              required: false,
              description: "Change handler",
            },
            {
              name: "placeholder",
              type: "string",
              required: false,
              description: "Placeholder text",
            },
            {
              name: "rows",
              type: "number",
              required: false,
              default: 3,
              description: "Number of rows",
            },
          ],
          examples: [
            {
              title: "Basic Textarea",
              description: "Multi-line text input",
              code: `import { Textarea } from '@/components/ui'\n\n<Textarea placeholder="Enter description" rows={4} />`,
              preview: React.createElement("textarea", {}),
            },
          ],
          relatedComponents: ["text-input"],
        },
        {
          id: "select",
          name: "Select",
          description: "Dropdown select input",
          importPath: "@/components/ui/Select",
          variants: [
            {
              name: "Default",
              description: "Standard select dropdown",
              props: { placeholder: "Select option..." },
              preview: React.createElement(
                "select",
                {},
                React.createElement("option", {}, "Select..."),
              ),
            },
          ],
          props: [
            {
              name: "value",
              type: "string",
              required: false,
              description: "Selected value",
            },
            {
              name: "onValueChange",
              type: "(value: string) => void",
              required: false,
              description: "Change handler",
            },
            {
              name: "placeholder",
              type: "string",
              required: false,
              description: "Placeholder text",
            },
            {
              name: "disabled",
              type: "boolean",
              required: false,
              default: false,
              description: "Whether select is disabled",
            },
          ],
          examples: [
            {
              title: "Basic Select",
              description: "Dropdown selection",
              code: `import { Select } from '@/components/ui'\n\n<Select>\n  <option value="1">Option 1</option>\n  <option value="2">Option 2</option>\n</Select>`,
              preview: React.createElement("select", {}),
            },
          ],
          relatedComponents: ["text-input", "radio-group"],
        },
        {
          id: "checkbox",
          name: "Checkbox",
          description: "Checkbox for multiple selections",
          importPath: "@/components/ui/Checkbox",
          variants: [
            {
              name: "Default",
              description: "Standard checkbox",
              props: { checked: false },
              preview: React.createElement("input", { type: "checkbox" }),
            },
          ],
          props: [
            {
              name: "checked",
              type: "boolean",
              required: false,
              description: "Whether checkbox is checked",
            },
            {
              name: "onCheckedChange",
              type: "(checked: boolean) => void",
              required: false,
              description: "Change handler",
            },
            {
              name: "disabled",
              type: "boolean",
              required: false,
              default: false,
              description: "Whether checkbox is disabled",
            },
          ],
          examples: [
            {
              title: "Basic Checkbox",
              description: "Simple checkbox",
              code: `import { Checkbox } from '@/components/ui'\n\n<Checkbox checked={agreed} onCheckedChange={setAgreed} />`,
              preview: React.createElement("input", { type: "checkbox" }),
            },
          ],
          relatedComponents: ["radio-group", "switch"],
        },
        {
          id: "radio-group",
          name: "RadioGroup",
          description: "Radio button group for single selection",
          importPath: "@/components/ui/RadioGroup",
          variants: [
            {
              name: "Default",
              description: "Standard radio group",
              props: { value: "option1" },
              preview: React.createElement("div", {}, "Radio Group"),
            },
          ],
          props: [
            {
              name: "value",
              type: "string",
              required: false,
              description: "Selected value",
            },
            {
              name: "onValueChange",
              type: "(value: string) => void",
              required: false,
              description: "Change handler",
            },
          ],
          examples: [
            {
              title: "Basic Radio Group",
              description: "Radio button selection",
              code: `import { RadioGroup } from '@/components/ui'\n\n<RadioGroup value={selected} onValueChange={setSelected} />`,
              preview: React.createElement("div", {}, "Radio"),
            },
          ],
          relatedComponents: ["checkbox", "select"],
        },
        {
          id: "slider",
          name: "Slider",
          description: "Slider for selecting numeric values",
          importPath: "@/components/ui/Slider",
          variants: [
            {
              name: "Default",
              description: "Standard slider",
              props: { value: [50], min: 0, max: 100 },
              preview: React.createElement("input", { type: "range" }),
            },
          ],
          props: [
            {
              name: "value",
              type: "number[]",
              required: false,
              description: "Slider value(s)",
            },
            {
              name: "onValueChange",
              type: "(value: number[]) => void",
              required: false,
              description: "Change handler",
            },
            {
              name: "min",
              type: "number",
              required: false,
              default: 0,
              description: "Minimum value",
            },
            {
              name: "max",
              type: "number",
              required: false,
              default: 100,
              description: "Maximum value",
            },
            {
              name: "step",
              type: "number",
              required: false,
              default: 1,
              description: "Step increment",
            },
          ],
          examples: [
            {
              title: "Basic Slider",
              description: "Numeric value slider",
              code: `import { Slider } from '@/components/ui'\n\n<Slider value={[50]} onValueChange={(value) => console.log(value)} />`,
              preview: React.createElement("input", { type: "range" }),
            },
          ],
          relatedComponents: ["text-input"],
        },
        {
          id: "date-picker",
          name: "DatePicker",
          description: "Date selection input",
          importPath: "@/components/ui/DatePicker",
          variants: [
            {
              name: "Default",
              description: "Standard date picker",
              props: { placeholder: "Select date..." },
              preview: React.createElement("input", { type: "date" }),
            },
          ],
          props: [
            {
              name: "value",
              type: "Date",
              required: false,
              description: "Selected date",
            },
            {
              name: "onChange",
              type: "(date: Date) => void",
              required: false,
              description: "Change handler",
            },
            {
              name: "placeholder",
              type: "string",
              required: false,
              description: "Placeholder text",
            },
          ],
          examples: [
            {
              title: "Basic DatePicker",
              description: "Date selection",
              code: `import { DatePicker } from '@/components/ui'\n\n<DatePicker value={date} onChange={setDate} />`,
              preview: React.createElement("input", { type: "date" }),
            },
          ],
          relatedComponents: ["date-range-picker", "calendar"],
        },
        {
          id: "date-range-picker",
          name: "DateRangePicker",
          description: "Date range selection input",
          importPath: "@/components/ui/DateRangePicker",
          variants: [
            {
              name: "Default",
              description: "Standard date range picker",
              props: { placeholder: "Select date range..." },
              preview: React.createElement("div", {}, "Date Range"),
            },
          ],
          props: [
            {
              name: "value",
              type: "{ from: Date, to: Date }",
              required: false,
              description: "Selected date range",
            },
            {
              name: "onChange",
              type: "(range: { from: Date, to: Date }) => void",
              required: false,
              description: "Change handler",
            },
          ],
          examples: [
            {
              title: "Basic DateRangePicker",
              description: "Date range selection",
              code: `import { DateRangePicker } from '@/components/ui'\n\n<DateRangePicker value={range} onChange={setRange} />`,
              preview: React.createElement("div", {}, "Date Range"),
            },
          ],
          relatedComponents: ["date-picker", "calendar"],
        },
        {
          id: "label",
          name: "Label",
          description: "Form label component",
          importPath: "@/components/ui/Label",
          variants: [
            {
              name: "Default",
              description: "Standard label",
              props: { children: "Label Text" },
              preview: React.createElement("label", {}, "Label Text"),
            },
          ],
          props: [
            {
              name: "htmlFor",
              type: "string",
              required: false,
              description: "ID of associated input",
            },
            {
              name: "children",
              type: "React.ReactNode",
              required: true,
              description: "Label content",
            },
          ],
          examples: [
            {
              title: "Basic Label",
              description: "Form field label",
              code: `import { Label } from '@/components/ui'\n\n<Label htmlFor="email">Email</Label>`,
              preview: React.createElement("label", {}, "Email"),
            },
          ],
          relatedComponents: ["text-input", "select"],
        },
      ],
    },
    {
      id: "data-display",
      name: "Data Display",
      description: "Components for displaying data and content",
      components: [
        {
          id: "table",
          name: "Table",
          description: "Data table component",
          importPath: "@/components/ui/Table",
          variants: [
            {
              name: "Default",
              description: "Standard table",
              props: {},
              preview: React.createElement(
                "table",
                {},
                React.createElement(
                  "tbody",
                  {},
                  React.createElement(
                    "tr",
                    {},
                    React.createElement("td", {}, "Data"),
                  ),
                ),
              ),
            },
          ],
          props: [
            {
              name: "children",
              type: "React.ReactNode",
              required: true,
              description: "Table content",
            },
          ],
          examples: [
            {
              title: "Basic Table",
              description: "Simple data table",
              code: `import { Table } from '@/components/ui'\n\n<Table>\n  <TableHead>...</TableHead>\n  <TableBody>...</TableBody>\n</Table>`,
              preview: React.createElement("table", {}),
            },
          ],
          relatedComponents: ["card"],
        },
        {
          id: "badge",
          name: "Badge",
          description: "Small status or label badge",
          importPath: "@/components/ui/Badge",
          variants: [
            {
              name: "Default",
              description: "Standard badge",
              props: { children: "Badge" },
              preview: React.createElement(
                "span",
                { className: "badge" },
                "Badge",
              ),
            },
            {
              name: "Success",
              description: "Success status badge",
              props: { variant: "success", children: "Success" },
              preview: React.createElement(
                "span",
                { className: "badge-success" },
                "Success",
              ),
            },
          ],
          props: [
            {
              name: "variant",
              type: '"default" | "success" | "warning" | "danger"',
              required: false,
              default: "default",
              description: "Badge variant",
            },
            {
              name: "children",
              type: "React.ReactNode",
              required: true,
              description: "Badge content",
            },
          ],
          examples: [
            {
              title: "Basic Badge",
              description: "Status badge",
              code: `import { Badge } from '@/components/ui'\n\n<Badge variant="success">Active</Badge>`,
              preview: React.createElement("span", {}, "Active"),
            },
          ],
          relatedComponents: ["callout"],
        },
        {
          id: "card",
          name: "Card",
          description: "Container card component",
          importPath: "@/components/ui/Card",
          variants: [
            {
              name: "Default",
              description: "Standard card",
              props: { children: "Card Content" },
              preview: React.createElement(
                "div",
                { className: "card" },
                "Card Content",
              ),
            },
          ],
          props: [
            {
              name: "children",
              type: "React.ReactNode",
              required: true,
              description: "Card content",
            },
          ],
          examples: [
            {
              title: "Basic Card",
              description: "Content container",
              code: `import { Card } from '@/components/ui'\n\n<Card>\n  <h3>Title</h3>\n  <p>Content</p>\n</Card>`,
              preview: React.createElement("div", {}, "Card"),
            },
          ],
          relatedComponents: ["stats-card"],
        },
        {
          id: "category-bar",
          name: "CategoryBar",
          description: "Horizontal bar showing category distribution",
          importPath: "@/components/ui/CategoryBar",
          variants: [
            {
              name: "Default",
              description: "Standard category bar",
              props: { values: [40, 30, 30] },
              preview: React.createElement(
                "div",
                { className: "category-bar" },
                "Category Bar",
              ),
            },
          ],
          props: [
            {
              name: "values",
              type: "number[]",
              required: true,
              description: "Category values",
            },
            {
              name: "colors",
              type: "string[]",
              required: false,
              description: "Category colors",
            },
          ],
          examples: [
            {
              title: "Basic CategoryBar",
              description: "Category distribution",
              code: `import { CategoryBar } from '@/components/ui'\n\n<CategoryBar values={[40, 30, 30]} />`,
              preview: React.createElement("div", {}, "CategoryBar"),
            },
          ],
          relatedComponents: ["bar-list", "progress-bar"],
        },
        {
          id: "bar-list",
          name: "BarList",
          description: "List of horizontal bars with labels",
          importPath: "@/components/ui/BarList",
          variants: [
            {
              name: "Default",
              description: "Standard bar list",
              props: { data: [] },
              preview: React.createElement("div", {}, "Bar List"),
            },
          ],
          props: [
            {
              name: "data",
              type: "Array<{ name: string, value: number }>",
              required: true,
              description: "Bar data",
            },
          ],
          examples: [
            {
              title: "Basic BarList",
              description: "Horizontal bar list",
              code: `import { BarList } from '@/components/ui'\n\n<BarList data={[\n  { name: 'Item 1', value: 100 },\n  { name: 'Item 2', value: 80 }\n]} />`,
              preview: React.createElement("div", {}, "BarList"),
            },
          ],
          relatedComponents: ["category-bar", "bar-chart"],
        },
        {
          id: "tracker",
          name: "Tracker",
          description: "Visual tracker for status or progress",
          importPath: "@/components/ui/Tracker",
          variants: [
            {
              name: "Default",
              description: "Standard tracker",
              props: { data: [] },
              preview: React.createElement("div", {}, "Tracker"),
            },
          ],
          props: [
            {
              name: "data",
              type: "Array<{ color: string, tooltip: string }>",
              required: true,
              description: "Tracker data",
            },
          ],
          examples: [
            {
              title: "Basic Tracker",
              description: "Status tracker",
              code: `import { Tracker } from '@/components/ui'\n\n<Tracker data={trackerData} />`,
              preview: React.createElement("div", {}, "Tracker"),
            },
          ],
          relatedComponents: ["progress-bar"],
        },
        {
          id: "progress-bar",
          name: "ProgressBar",
          description: "Linear progress indicator",
          importPath: "@/components/ui/ProgressBar",
          variants: [
            {
              name: "Default",
              description: "Standard progress bar",
              props: { value: 50 },
              preview: React.createElement(
                "div",
                { className: "progress-bar" },
                "Progress",
              ),
            },
          ],
          props: [
            {
              name: "value",
              type: "number",
              required: true,
              description: "Progress value (0-100)",
            },
            {
              name: "color",
              type: "string",
              required: false,
              description: "Progress bar color",
            },
          ],
          examples: [
            {
              title: "Basic ProgressBar",
              description: "Linear progress",
              code: `import { ProgressBar } from '@/components/ui'\n\n<ProgressBar value={75} />`,
              preview: React.createElement("div", {}, "Progress"),
            },
          ],
          relatedComponents: ["progress-circle", "tracker"],
        },
        {
          id: "progress-circle",
          name: "ProgressCircle",
          description: "Circular progress indicator",
          importPath: "@/components/ui/ProgressCircle",
          variants: [
            {
              name: "Default",
              description: "Standard progress circle",
              props: { value: 50 },
              preview: React.createElement("div", {}, "Circle"),
            },
          ],
          props: [
            {
              name: "value",
              type: "number",
              required: true,
              description: "Progress value (0-100)",
            },
            {
              name: "color",
              type: "string",
              required: false,
              description: "Progress color",
            },
          ],
          examples: [
            {
              title: "Basic ProgressCircle",
              description: "Circular progress",
              code: `import { ProgressCircle } from '@/components/ui'\n\n<ProgressCircle value={75} />`,
              preview: React.createElement("div", {}, "Circle"),
            },
          ],
          relatedComponents: ["progress-bar"],
        },
        {
          id: "avatar",
          name: "Avatar",
          description: "User avatar component",
          importPath: "@/components/ui",
          variants: [
            {
              name: "Default",
              description: "Standard avatar",
              props: { name: "John Doe" },
              preview: React.createElement(
                "div",
                { className: "avatar" },
                "JD",
              ),
            },
          ],
          props: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "User name",
            },
            {
              name: "src",
              type: "string",
              required: false,
              description: "Avatar image URL",
            },
          ],
          examples: [
            {
              title: "Basic Avatar",
              description: "User avatar",
              code: `import { Avatar } from '@/components/ui'\n\n<Avatar name="John Doe" />`,
              preview: React.createElement("div", {}, "Avatar"),
            },
          ],
          relatedComponents: ["badge"],
        },
        {
          id: "stats-card",
          name: "StatsCard",
          description: "Card for displaying statistics",
          importPath: "@/components/StatsCard",
          variants: [
            {
              name: "Default",
              description: "Standard stats card",
              props: { title: "Total Users", value: "1,234" },
              preview: React.createElement("div", {}, "Stats"),
            },
          ],
          props: [
            {
              name: "title",
              type: "string",
              required: true,
              description: "Stat title",
            },
            {
              name: "value",
              type: "string | number",
              required: true,
              description: "Stat value",
            },
          ],
          examples: [
            {
              title: "Basic StatsCard",
              description: "Statistics display",
              code: `import { StatsCard } from '@/shared/ui/information/StatsCard'\n\n<StatsCard title="Revenue" value="$12,345" />`,
              preview: React.createElement("div", {}, "Stats"),
            },
          ],
          relatedComponents: ["card"],
        },
      ],
    },
    {
      id: "feedback",
      name: "Feedback",
      description: "Components for user feedback and notifications",
      components: [
        {
          id: "dialog",
          name: "Dialog",
          description: "Modal dialog component",
          importPath: "@/components/ui/Dialog",
          variants: [
            {
              name: "Default",
              description: "Standard dialog",
              props: { open: false },
              preview: React.createElement("div", {}, "Dialog"),
            },
          ],
          props: [
            {
              name: "open",
              type: "boolean",
              required: true,
              description: "Whether dialog is open",
            },
            {
              name: "onOpenChange",
              type: "(open: boolean) => void",
              required: false,
              description: "Open state change handler",
            },
            {
              name: "children",
              type: "React.ReactNode",
              required: true,
              description: "Dialog content",
            },
          ],
          examples: [
            {
              title: "Basic Dialog",
              description: "Modal dialog",
              code: `import { Dialog } from '@/components/ui'\n\n<Dialog open={isOpen} onOpenChange={setIsOpen}>\n  <DialogContent>...</DialogContent>\n</Dialog>`,
              preview: React.createElement("div", {}, "Dialog"),
            },
          ],
          relatedComponents: ["drawer", "popover"],
        },
        {
          id: "drawer",
          name: "Drawer",
          description: "Slide-out drawer component",
          importPath: "@/components/ui/Drawer",
          variants: [
            {
              name: "Default",
              description: "Standard drawer",
              props: { open: false },
              preview: React.createElement("div", {}, "Drawer"),
            },
          ],
          props: [
            {
              name: "open",
              type: "boolean",
              required: true,
              description: "Whether drawer is open",
            },
            {
              name: "onOpenChange",
              type: "(open: boolean) => void",
              required: false,
              description: "Open state change handler",
            },
            {
              name: "children",
              type: "React.ReactNode",
              required: true,
              description: "Drawer content",
            },
          ],
          examples: [
            {
              title: "Basic Drawer",
              description: "Slide-out panel",
              code: `import { Drawer } from '@/components/ui'\n\n<Drawer open={isOpen} onOpenChange={setIsOpen}>\n  <DrawerContent>...</DrawerContent>\n</Drawer>`,
              preview: React.createElement("div", {}, "Drawer"),
            },
          ],
          relatedComponents: ["dialog"],
        },
        {
          id: "popover",
          name: "Popover",
          description: "Popover tooltip component",
          importPath: "@/components/ui/Popover",
          variants: [
            {
              name: "Default",
              description: "Standard popover",
              props: {},
              preview: React.createElement("div", {}, "Popover"),
            },
          ],
          props: [
            {
              name: "children",
              type: "React.ReactNode",
              required: true,
              description: "Popover content",
            },
          ],
          examples: [
            {
              title: "Basic Popover",
              description: "Popover tooltip",
              code: `import { Popover } from '@/components/ui'\n\n<Popover>\n  <PopoverTrigger>...</PopoverTrigger>\n  <PopoverContent>...</PopoverContent>\n</Popover>`,
              preview: React.createElement("div", {}, "Popover"),
            },
          ],
          relatedComponents: ["tooltip", "dropdown-menu"],
        },
        {
          id: "tooltip",
          name: "Tooltip",
          description: "Hover tooltip component",
          importPath: "@/components/ui/Tooltip",
          variants: [
            {
              name: "Default",
              description: "Standard tooltip",
              props: { content: "Tooltip text" },
              preview: React.createElement("div", {}, "Tooltip"),
            },
          ],
          props: [
            {
              name: "content",
              type: "React.ReactNode",
              required: true,
              description: "Tooltip content",
            },
            {
              name: "children",
              type: "React.ReactNode",
              required: true,
              description: "Trigger element",
            },
          ],
          examples: [
            {
              title: "Basic Tooltip",
              description: "Hover tooltip",
              code: `import { Tooltip } from '@/components/ui'\n\n<Tooltip content="Help text">\n  <Button>Hover me</Button>\n</Tooltip>`,
              preview: React.createElement("div", {}, "Tooltip"),
            },
          ],
          relatedComponents: ["popover"],
        },
        {
          id: "callout",
          name: "Callout",
          description: "Informational callout box",
          importPath: "@/components/ui/Callout",
          variants: [
            {
              name: "Info",
              description: "Info callout",
              props: { variant: "info", children: "Information message" },
              preview: React.createElement(
                "div",
                { className: "callout-info" },
                "Info",
              ),
            },
            {
              name: "Warning",
              description: "Warning callout",
              props: { variant: "warning", children: "Warning message" },
              preview: React.createElement(
                "div",
                { className: "callout-warning" },
                "Warning",
              ),
            },
          ],
          props: [
            {
              name: "variant",
              type: '"info" | "success" | "warning" | "danger"',
              required: false,
              default: "info",
              description: "Callout variant",
            },
            {
              name: "children",
              type: "React.ReactNode",
              required: true,
              description: "Callout content",
            },
          ],
          examples: [
            {
              title: "Basic Callout",
              description: "Info callout",
              code: `import { Callout } from '@/components/ui'\n\n<Callout variant="warning">\n  Please review before submitting\n</Callout>`,
              preview: React.createElement("div", {}, "Callout"),
            },
          ],
          relatedComponents: ["badge"],
        },
        {
          id: "empty-state",
          name: "EmptyState",
          description: "Empty state placeholder",
          importPath: "@/components/EmptyState",
          variants: [
            {
              name: "Default",
              description: "Standard empty state",
              props: { message: "No data available" },
              preview: React.createElement("div", {}, "Empty"),
            },
          ],
          props: [
            {
              name: "message",
              type: "string",
              required: true,
              description: "Empty state message",
            },
            {
              name: "icon",
              type: "React.ReactNode",
              required: false,
              description: "Empty state icon",
            },
          ],
          examples: [
            {
              title: "Basic EmptyState",
              description: "No data placeholder",
              code: `import { EmptyState } from '@/shared/ui/information/EmptyState'\n\n<EmptyState message="No items found" />`,
              preview: React.createElement("div", {}, "Empty"),
            },
          ],
          relatedComponents: ["spinner", "skeleton"],
        },
        {
          id: "spinner",
          name: "Spinner",
          description: "Loading spinner",
          importPath: "@/components/ui",
          variants: [
            {
              name: "Default",
              description: "Standard spinner",
              props: {},
              preview: React.createElement(
                "div",
                { className: "spinner" },
                "⟳",
              ),
            },
          ],
          props: [
            {
              name: "size",
              type: '"sm" | "md" | "lg"',
              required: false,
              default: "md",
              description: "Spinner size",
            },
          ],
          examples: [
            {
              title: "Basic Spinner",
              description: "Loading indicator",
              code: `import { Spinner } from '@/components/ui'\n\n<Spinner />`,
              preview: React.createElement("div", {}, "Loading..."),
            },
          ],
          relatedComponents: ["skeleton", "progress-bar"],
        },
        {
          id: "skeleton",
          name: "Skeleton",
          description: "Loading skeleton placeholder",
          importPath: "@/components/ui",
          variants: [
            {
              name: "Default",
              description: "Standard skeleton",
              props: {},
              preview: React.createElement(
                "div",
                { className: "skeleton" },
                "▭",
              ),
            },
          ],
          props: [
            {
              name: "className",
              type: "string",
              required: false,
              description: "Additional CSS classes",
            },
          ],
          examples: [
            {
              title: "Basic Skeleton",
              description: "Loading placeholder",
              code: `import { Skeleton } from '@/components/ui'\n\n<Skeleton className="h-4 w-full" />`,
              preview: React.createElement("div", {}, "Skeleton"),
            },
          ],
          relatedComponents: ["spinner"],
        },
      ],
    },
    {
      id: "navigation",
      name: "Navigation",
      description: "Components for navigation and menus",
      components: [
        {
          id: "tabs",
          name: "Tabs",
          description: "Tab navigation component",
          importPath: "@/components/ui/Tabs",
          variants: [
            {
              name: "Default",
              description: "Standard tabs",
              props: { defaultValue: "tab1" },
              preview: React.createElement("div", {}, "Tabs"),
            },
          ],
          props: [
            {
              name: "defaultValue",
              type: "string",
              required: false,
              description: "Default active tab",
            },
            {
              name: "value",
              type: "string",
              required: false,
              description: "Controlled active tab",
            },
            {
              name: "onValueChange",
              type: "(value: string) => void",
              required: false,
              description: "Tab change handler",
            },
          ],
          examples: [
            {
              title: "Basic Tabs",
              description: "Tab navigation",
              code: `import { Tabs } from '@/components/ui'\n\n<Tabs defaultValue="tab1">\n  <TabsList>\n    <TabsTrigger value="tab1">Tab 1</TabsTrigger>\n    <TabsTrigger value="tab2">Tab 2</TabsTrigger>\n  </TabsList>\n</Tabs>`,
              preview: React.createElement("div", {}, "Tabs"),
            },
          ],
          relatedComponents: ["accordion", "tab-navigation"],
        },
        {
          id: "accordion",
          name: "Accordion",
          description: "Collapsible accordion component",
          importPath: "@/components/ui/Accordion",
          variants: [
            {
              name: "Default",
              description: "Standard accordion",
              props: { type: "single" },
              preview: React.createElement("div", {}, "Accordion"),
            },
          ],
          props: [
            {
              name: "type",
              type: '"single" | "multiple"',
              required: true,
              description: "Accordion type",
            },
            {
              name: "collapsible",
              type: "boolean",
              required: false,
              description: "Whether items can collapse",
            },
          ],
          examples: [
            {
              title: "Basic Accordion",
              description: "Collapsible sections",
              code: `import { Accordion } from '@/components/ui'\n\n<Accordion type="single">\n  <AccordionItem value="item1">\n    <AccordionTrigger>Section 1</AccordionTrigger>\n    <AccordionContent>Content</AccordionContent>\n  </AccordionItem>\n</Accordion>`,
              preview: React.createElement("div", {}, "Accordion"),
            },
          ],
          relatedComponents: ["tabs"],
        },
        {
          id: "dropdown-menu",
          name: "DropdownMenu",
          description: "Dropdown menu component",
          importPath: "@/components/ui/DropdownMenu",
          variants: [
            {
              name: "Default",
              description: "Standard dropdown menu",
              props: {},
              preview: React.createElement("div", {}, "Menu"),
            },
          ],
          props: [
            {
              name: "children",
              type: "React.ReactNode",
              required: true,
              description: "Menu content",
            },
          ],
          examples: [
            {
              title: "Basic DropdownMenu",
              description: "Dropdown menu",
              code: `import { DropdownMenu } from '@/components/ui'\n\n<DropdownMenu>\n  <DropdownMenuTrigger>Menu</DropdownMenuTrigger>\n  <DropdownMenuContent>\n    <DropdownMenuItem>Item 1</DropdownMenuItem>\n  </DropdownMenuContent>\n</DropdownMenu>`,
              preview: React.createElement("div", {}, "Menu"),
            },
          ],
          relatedComponents: ["popover"],
        },
        {
          id: "tab-navigation",
          name: "TabNavigation",
          description: "Custom tab navigation component",
          importPath: "@/components/ui",
          variants: [
            {
              name: "Default",
              description: "Standard tab navigation",
              props: { tabs: [] },
              preview: React.createElement("div", {}, "TabNav"),
            },
          ],
          props: [
            {
              name: "tabs",
              type: "Array<{ label: string, value: string }>",
              required: true,
              description: "Tab items",
            },
            {
              name: "activeTab",
              type: "string",
              required: false,
              description: "Active tab value",
            },
          ],
          examples: [
            {
              title: "Basic TabNavigation",
              description: "Custom tab navigation",
              code: `import { TabNavigation } from '@/components/ui'\n\n<TabNavigation tabs={[\n  { label: 'Overview', value: 'overview' },\n  { label: 'Details', value: 'details' }\n]} />`,
              preview: React.createElement("div", {}, "TabNav"),
            },
          ],
          relatedComponents: ["tabs"],
        },
        {
          id: "command-bar",
          name: "CommandBar",
          description: "Command palette component",
          importPath: "@/components/ui",
          variants: [
            {
              name: "Default",
              description: "Standard command bar",
              props: {},
              preview: React.createElement("div", {}, "Command"),
            },
          ],
          props: [
            {
              name: "open",
              type: "boolean",
              required: false,
              description: "Whether command bar is open",
            },
          ],
          examples: [
            {
              title: "Basic CommandBar",
              description: "Command palette",
              code: `import { CommandBar } from '@/components/ui'\n\n<CommandBar open={isOpen} />`,
              preview: React.createElement("div", {}, "Command"),
            },
          ],
          relatedComponents: ["dropdown-menu"],
        },
      ],
    },
    {
      id: "layout",
      name: "Layout",
      description: "Components for page layout and structure",
      components: [
        {
          id: "divider",
          name: "Divider",
          description: "Visual divider line",
          importPath: "@/components/ui/Divider",
          variants: [
            {
              name: "Horizontal",
              description: "Horizontal divider",
              props: { orientation: "horizontal" },
              preview: React.createElement("hr", {}),
            },
            {
              name: "Vertical",
              description: "Vertical divider",
              props: { orientation: "vertical" },
              preview: React.createElement(
                "div",
                { className: "divider-vertical" },
                "|",
              ),
            },
          ],
          props: [
            {
              name: "orientation",
              type: '"horizontal" | "vertical"',
              required: false,
              default: "horizontal",
              description: "Divider orientation",
            },
          ],
          examples: [
            {
              title: "Basic Divider",
              description: "Horizontal divider",
              code: `import { Divider } from '@/components/ui'\n\n<Divider />`,
              preview: React.createElement("hr", {}),
            },
          ],
          relatedComponents: [],
        },
        {
          id: "page-header",
          name: "PageHeader",
          description: "Page header with title and actions",
          importPath: "@/components/PageHeader",
          variants: [
            {
              name: "Default",
              description: "Standard page header",
              props: { title: "Page Title" },
              preview: React.createElement("div", {}, "Page Header"),
            },
          ],
          props: [
            {
              name: "title",
              type: "string",
              required: true,
              description: "Page title",
            },
            {
              name: "actions",
              type: "React.ReactNode",
              required: false,
              description: "Header actions",
            },
          ],
          examples: [
            {
              title: "Basic PageHeader",
              description: "Page header",
              code: `import { PageHeader } from '@/shared/ui/misc/PageHeader'\n\n<PageHeader title="Dashboard" />`,
              preview: React.createElement("div", {}, "Header"),
            },
          ],
          relatedComponents: ["card"],
        },
        {
          id: "table-section",
          name: "TableSection",
          description: "Section wrapper for tables",
          importPath: "@/components/TableSection",
          variants: [
            {
              name: "Default",
              description: "Standard table section",
              props: { title: "Data Table" },
              preview: React.createElement("div", {}, "Table Section"),
            },
          ],
          props: [
            {
              name: "title",
              type: "string",
              required: true,
              description: "Section title",
            },
            {
              name: "children",
              type: "React.ReactNode",
              required: true,
              description: "Table content",
            },
          ],
          examples: [
            {
              title: "Basic TableSection",
              description: "Table wrapper",
              code: `import { TableSection } from '@/shared/ui/structure/TableSection'\n\n<TableSection title="Users">\n  <Table>...</Table>\n</TableSection>`,
              preview: React.createElement("div", {}, "TableSection"),
            },
          ],
          relatedComponents: ["table", "card"],
        },
        {
          id: "calendar",
          name: "Calendar",
          description: "Calendar date picker component",
          importPath: "@/components/ui/Calendar",
          variants: [
            {
              name: "Default",
              description: "Standard calendar",
              props: {},
              preview: React.createElement("div", {}, "Calendar"),
            },
          ],
          props: [
            {
              name: "mode",
              type: '"single" | "multiple" | "range"',
              required: false,
              description: "Selection mode",
            },
            {
              name: "selected",
              type: "Date | Date[]",
              required: false,
              description: "Selected date(s)",
            },
            {
              name: "onSelect",
              type: "(date: Date | Date[]) => void",
              required: false,
              description: "Selection handler",
            },
          ],
          examples: [
            {
              title: "Basic Calendar",
              description: "Date picker calendar",
              code: `import { Calendar } from '@/components/ui'\n\n<Calendar mode="single" selected={date} onSelect={setDate} />`,
              preview: React.createElement("div", {}, "Calendar"),
            },
          ],
          relatedComponents: ["date-picker", "date-range-picker"],
        },
      ],
    },
    {
      id: "charts",
      name: "Charts",
      description: "Data visualization chart components",
      components: [
        {
          id: "area-chart",
          name: "AreaChart",
          description: "Area chart for time series data",
          importPath: "@/components/ui/AreaChart",
          variants: [
            {
              name: "Default",
              description: "Standard area chart",
              props: { data: [] },
              preview: React.createElement("div", {}, "Area Chart"),
            },
          ],
          props: [
            {
              name: "data",
              type: "Array<Record<string, any>>",
              required: true,
              description: "Chart data",
            },
            {
              name: "index",
              type: "string",
              required: true,
              description: "X-axis data key",
            },
            {
              name: "categories",
              type: "string[]",
              required: true,
              description: "Y-axis data keys",
            },
          ],
          examples: [
            {
              title: "Basic AreaChart",
              description: "Time series area chart",
              code: `import { AreaChart } from '@/components/ui'\n\n<AreaChart\n  data={chartData}\n  index="date"\n  categories={["sales", "revenue"]}\n/>`,
              preview: React.createElement("div", {}, "AreaChart"),
            },
          ],
          relatedComponents: ["line-chart", "bar-chart"],
        },
        {
          id: "bar-chart",
          name: "BarChart",
          description: "Bar chart for categorical data",
          importPath: "@/components/ui/BarChart",
          variants: [
            {
              name: "Default",
              description: "Standard bar chart",
              props: { data: [] },
              preview: React.createElement("div", {}, "Bar Chart"),
            },
          ],
          props: [
            {
              name: "data",
              type: "Array<Record<string, any>>",
              required: true,
              description: "Chart data",
            },
            {
              name: "index",
              type: "string",
              required: true,
              description: "X-axis data key",
            },
            {
              name: "categories",
              type: "string[]",
              required: true,
              description: "Y-axis data keys",
            },
          ],
          examples: [
            {
              title: "Basic BarChart",
              description: "Categorical bar chart",
              code: `import { BarChart } from '@/components/ui'\n\n<BarChart\n  data={chartData}\n  index="category"\n  categories={["value"]}\n/>`,
              preview: React.createElement("div", {}, "BarChart"),
            },
          ],
          relatedComponents: ["area-chart", "line-chart"],
        },
        {
          id: "line-chart",
          name: "LineChart",
          description: "Line chart for trends",
          importPath: "@/components/ui/LineChart",
          variants: [
            {
              name: "Default",
              description: "Standard line chart",
              props: { data: [] },
              preview: React.createElement("div", {}, "Line Chart"),
            },
          ],
          props: [
            {
              name: "data",
              type: "Array<Record<string, any>>",
              required: true,
              description: "Chart data",
            },
            {
              name: "index",
              type: "string",
              required: true,
              description: "X-axis data key",
            },
            {
              name: "categories",
              type: "string[]",
              required: true,
              description: "Y-axis data keys",
            },
          ],
          examples: [
            {
              title: "Basic LineChart",
              description: "Trend line chart",
              code: `import { LineChart } from '@/components/ui'\n\n<LineChart\n  data={chartData}\n  index="date"\n  categories={["metric"]}\n/>`,
              preview: React.createElement("div", {}, "LineChart"),
            },
          ],
          relatedComponents: ["area-chart", "bar-chart"],
        },
        {
          id: "donut-chart",
          name: "DonutChart",
          description: "Donut chart for proportions",
          importPath: "@/components/ui/DonutChart",
          variants: [
            {
              name: "Default",
              description: "Standard donut chart",
              props: { data: [] },
              preview: React.createElement("div", {}, "Donut Chart"),
            },
          ],
          props: [
            {
              name: "data",
              type: "Array<{ name: string, value: number }>",
              required: true,
              description: "Chart data",
            },
            {
              name: "category",
              type: "string",
              required: true,
              description: "Value key",
            },
          ],
          examples: [
            {
              title: "Basic DonutChart",
              description: "Proportion donut chart",
              code: `import { DonutChart } from '@/components/ui'\n\n<DonutChart\n  data={[\n    { name: 'A', value: 40 },\n    { name: 'B', value: 60 }\n  ]}\n  category="value"\n/>`,
              preview: React.createElement("div", {}, "DonutChart"),
            },
          ],
          relatedComponents: ["progress-circle"],
        },
        {
          id: "radar-chart",
          name: "RadarChart",
          description: "Radar chart for multi-dimensional data",
          importPath: "@/components/ui",
          variants: [
            {
              name: "Default",
              description: "Standard radar chart",
              props: { data: [] },
              preview: React.createElement("div", {}, "Radar Chart"),
            },
          ],
          props: [
            {
              name: "data",
              type: "Array<Record<string, any>>",
              required: true,
              description: "Chart data",
            },
          ],
          examples: [
            {
              title: "Basic RadarChart",
              description: "Multi-dimensional radar chart",
              code: `import { RadarChart } from '@/components/ui'\n\n<RadarChart data={radarData} />`,
              preview: React.createElement("div", {}, "RadarChart"),
            },
          ],
          relatedComponents: ["donut-chart"],
        },
        {
          id: "spark-area-chart",
          name: "SparkAreaChart",
          description: "Compact sparkline area chart",
          importPath: "@/components/ui/SparkAreaChart",
          variants: [
            {
              name: "Default",
              description: "Standard spark area chart",
              props: { data: [] },
              preview: React.createElement("div", {}, "Spark Area"),
            },
          ],
          props: [
            {
              name: "data",
              type: "Array<Record<string, any>>",
              required: true,
              description: "Chart data",
            },
            {
              name: "categories",
              type: "string[]",
              required: true,
              description: "Data keys",
            },
          ],
          examples: [
            {
              title: "Basic SparkAreaChart",
              description: "Compact area sparkline",
              code: `import { SparkAreaChart } from '@/components/ui'\n\n<SparkAreaChart data={data} categories={["value"]} />`,
              preview: React.createElement("div", {}, "SparkArea"),
            },
          ],
          relatedComponents: ["spark-line-chart", "spark-bar-chart"],
        },
        {
          id: "spark-bar-chart",
          name: "SparkBarChart",
          description: "Compact sparkline bar chart",
          importPath: "@/components/ui/SparkBarChart",
          variants: [
            {
              name: "Default",
              description: "Standard spark bar chart",
              props: { data: [] },
              preview: React.createElement("div", {}, "Spark Bar"),
            },
          ],
          props: [
            {
              name: "data",
              type: "Array<Record<string, any>>",
              required: true,
              description: "Chart data",
            },
            {
              name: "categories",
              type: "string[]",
              required: true,
              description: "Data keys",
            },
          ],
          examples: [
            {
              title: "Basic SparkBarChart",
              description: "Compact bar sparkline",
              code: `import { SparkBarChart } from '@/components/ui'\n\n<SparkBarChart data={data} categories={["value"]} />`,
              preview: React.createElement("div", {}, "SparkBar"),
            },
          ],
          relatedComponents: ["spark-area-chart", "spark-line-chart"],
        },
        {
          id: "spark-line-chart",
          name: "SparkLineChart",
          description: "Compact sparkline line chart",
          importPath: "@/components/ui/SparkLineChart",
          variants: [
            {
              name: "Default",
              description: "Standard spark line chart",
              props: { data: [] },
              preview: React.createElement("div", {}, "Spark Line"),
            },
          ],
          props: [
            {
              name: "data",
              type: "Array<Record<string, any>>",
              required: true,
              description: "Chart data",
            },
            {
              name: "categories",
              type: "string[]",
              required: true,
              description: "Data keys",
            },
          ],
          examples: [
            {
              title: "Basic SparkLineChart",
              description: "Compact line sparkline",
              code: `import { SparkLineChart } from '@/components/ui'\n\n<SparkLineChart data={data} categories={["value"]} />`,
              preview: React.createElement("div", {}, "SparkLine"),
            },
          ],
          relatedComponents: ["spark-area-chart", "spark-bar-chart"],
        },
      ],
    },
  ],
}
