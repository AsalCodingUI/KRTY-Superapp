"use client"

import * as React from "react"

import { SlidingIndicator } from "@/components/sliding-indicator"
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
  /** Replaces the sliding thumb's shadow (e.g. the chrome's active shadow). */
  indicatorClassName?: string
  fitContent?: boolean
  /** @deprecated kept for API compatibility; one size (shadcn default). */
  size?: "sm" | "md"
}

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  disabled,
  className,
  indicatorClassName,
  fitContent = false,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup
      spacing={0}
      value={[value]}
      disabled={disabled}
      onValueChange={(next) => {
        // Base UI emits [] when the active item is clicked again; keep a value selected.
        if (next[0]) onChange(next[0] as T)
      }}
      className={cn(
        // Same metrics as shadcn TabsList (h-8, p-[3px]).
        "bg-accent dark:bg-muted text-muted-foreground relative h-8 items-center rounded-full p-0.5",
        fitContent ? "inline-flex w-auto" : "flex w-full",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {/* One highlight that slides to the pressed item. */}
      <SlidingIndicator
        activeSelector="[data-pressed]"
        className={cn(
          "bg-background dark:bg-foreground/[0.13] rounded-full",
          indicatorClassName ?? "smooth-shadow-ring-xs dark:shadow-none",
        )}
      />
      {items.map((item) => {
        const LeadingIcon = item.leadingIcon ?? item.icon
        const TrailingIcon = item.trailingIcon
        const showLeadingIcon = item.showLeadingIcon ?? true
        const showTrailingIcon = item.showTrailingIcon ?? true

        return (
          <ToggleGroupItem
            key={item.value}
            value={item.value}
            disabled={Boolean(disabled || item.disabled)}
            className={cn(
              // reset toggle-group "spacing=0" joined styles
              "relative h-full min-w-0 gap-1.5 border border-transparent text-sm font-medium whitespace-nowrap shadow-none",
              "group-data-[spacing=0]/toggle-group:rounded-[inherit] group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-[inherit] group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-[inherit]",
              "rounded-full! px-2! py-0.5",
              fitContent ? "flex-none" : "flex-1",
              "text-foreground/60 hover:text-foreground hover:bg-transparent",
              // Base UI Toggle marks the active item with data-pressed
              // The pressed look comes from the sliding indicator behind.
              "data-pressed:text-foreground data-pressed:border-transparent data-pressed:bg-transparent data-pressed:hover:bg-transparent",
              "disabled:text-muted-foreground/50",
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
