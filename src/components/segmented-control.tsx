"use client"

import * as React from "react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

export interface SegmentedControlItem<T extends string> {
  value: T
  label: React.ReactNode
  icon?: React.ElementType
  leadingIcon?: React.ElementType
  trailingIcon?: React.ElementType
  showLeadingIcon?: boolean
  showTrailingIcon?: boolean
  disabled?: boolean
}

export interface SegmentedControlProps<T extends string> {
  items: SegmentedControlItem<T>[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  className?: string
  fitContent?: boolean
  size?: "sm" | "md"
}

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  disabled,
  className,
  fitContent = false,
  size = "md",
}: SegmentedControlProps<T>) {
  const isSmall = size === "sm"
  const activeIndex = items.findIndex((item) => item.value === value)

  return (
    <ToggleGroup
      type="single"
      spacing={0}
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        // Radix emits "" when the active item is clicked again; keep a value selected.
        if (next) onChange(next as T)
      }}
      className={cn(
        "bg-muted p-0.5",
        isSmall ? "rounded-md" : "rounded-lg",
        fitContent ? "inline-flex w-auto" : "flex w-full",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {items.map((item, index) => {
        const LeadingIcon = item.leadingIcon ?? item.icon
        const TrailingIcon = item.trailingIcon
        const showLeadingIcon = item.showLeadingIcon ?? true
        const showTrailingIcon = item.showTrailingIcon ?? true
        // Divider between two inactive neighbours (hidden next to the active item)
        const showDivider =
          index < items.length - 1 &&
          (activeIndex === -1 ||
            (activeIndex !== index && activeIndex !== index + 1))

        return (
          <ToggleGroupItem
            key={item.value}
            value={item.value}
            disabled={Boolean(disabled || item.disabled)}
            className={cn(
              // reset toggle-group "spacing=0" joined styles
              "relative h-auto min-w-0 gap-0.5 border-0 text-label-sm whitespace-nowrap shadow-none",
              "group-data-[spacing=0]/toggle-group:rounded-[inherit] group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-[inherit] group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-[inherit]",
              isSmall
                ? "rounded-sm! px-1.5! py-0.5"
                : "rounded-md! px-2! py-1",
              fitContent ? "flex-none" : "flex-1",
              "text-muted-foreground/70 hover:bg-accent hover:text-muted-foreground",
              "data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=on]:hover:bg-background",
              "disabled:text-muted-foreground/50",
              showDivider &&
                "after:absolute after:inset-y-1.5 after:-right-px after:w-px after:bg-border",
            )}
          >
            {showLeadingIcon && LeadingIcon && (
              <LeadingIcon
                className="size-3.5 shrink-0 text-current"
                aria-hidden="true"
              />
            )}
            <span className="text-current">{item.label}</span>
            {showTrailingIcon && TrailingIcon && (
              <TrailingIcon
                className="size-3.5 shrink-0 text-current"
                aria-hidden="true"
              />
            )}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
