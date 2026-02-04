// Custom Select [v0.0.0]

import * as SelectPrimitives from "@radix-ui/react-select"
import { RiArrowDownSLine, RiArrowUpSLine, RiCheckLine } from "@remixicon/react"
import { format } from "date-fns"
import React from "react"

import { cx, focusInput, hasErrorInput } from "@/shared/lib/utils"
import { DateRange } from "react-day-picker"

const Select = SelectPrimitives.Root

const SelectGroup = SelectPrimitives.Group

const SelectValue = SelectPrimitives.Value

const selectTriggerStyles = [
  cx(
    // base
    "group/trigger text-body-sm flex w-full cursor-pointer items-center justify-between gap-2 truncate rounded-md border px-2.5 py-1.5 transition outline-none select-none",
    // border color
    "border-border-default",
    // text color
    "text-foreground-primary",
    // placeholder
    "data-[placeholder]:text-foreground-placeholder",
    // background color
    "bg-surface",
    // hover
    "hover:bg-surface-neutral-secondary",
    // disabled
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
    focusInput,
    // invalid (optional)
    // "aria-[invalid=true]:dark:ring-red-400/20 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-200 aria-[invalid=true]:border-red-500 invalid:ring-2 invalid:ring-red-200 invalid:border-red-500"
  ),
]

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitives.Trigger> & {
    hasError?: boolean
  }
>(({ className, hasError, children, ...props }, forwardedRef) => {
  return (
    <SelectPrimitives.Trigger
      ref={forwardedRef}
      className={cx(
        selectTriggerStyles,
        hasError ? hasErrorInput : "",
        className,
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      <SelectPrimitives.Icon asChild>
        <RiArrowDownSLine
          className={cx(
            // base
            "-mr-1 size-5 shrink-0",
            // text color
            "text-foreground-placeholder",
            // disabled
            "group-data-[disabled]/trigger:text-foreground-disable",
          )}
        />
      </SelectPrimitives.Icon>
    </SelectPrimitives.Trigger>
  )
})

SelectTrigger.displayName = "SelectTrigger"

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitives.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitives.ScrollUpButton>
>(({ className, ...props }, forwardedRef) => (
  <SelectPrimitives.ScrollUpButton
    ref={forwardedRef}
    className={cx(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <RiArrowUpSLine className="size-3 shrink-0" aria-hidden="true" />
  </SelectPrimitives.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitives.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitives.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitives.ScrollDownButton>
>(({ className, ...props }, forwardedRef) => (
  <SelectPrimitives.ScrollDownButton
    ref={forwardedRef}
    className={cx(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <RiArrowDownSLine className="size-3 shrink-0" aria-hidden="true" />
  </SelectPrimitives.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitives.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitives.Content>
>(
  (
    {
      className,
      position = "popper",
      children,
      sideOffset = 8,
      collisionPadding = 10,
      ...props
    },
    forwardedRef,
  ) => (
    <SelectPrimitives.Portal>
      <SelectPrimitives.Content
        ref={forwardedRef}
        className={cx(
          // base
          "relative z-50 overflow-hidden rounded-md border shadow-xl shadow-black/[2.5%]",
          // widths
          "max-w-[95vw] min-w-[calc(var(--radix-select-trigger-width)-2px)]",
          // heights
          "max-h-[--radix-select-content-available-height]",
          // background color
          "bg-surface",
          // text color
          "text-foreground-primary",
          // border color
          "border-border-default",
          // transition
          "will-change-[transform,opacity]",
          // "data-[state=open]:animate-slideDownAndFade",
          "data-[state=closed]:animate-hide",
          "data-[state=bottom]:animate-slideDownAndFade data-[state=left]:animate-slideLeftAndFade data-[state=right]:animate-slideRightAndFade data-[state=top]:animate-slideUpAndFade",
          className,
        )}
        sideOffset={sideOffset}
        position={position}
        collisionPadding={collisionPadding}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitives.Viewport
          className={cx(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[calc(var(--radix-select-trigger-width))]",
          )}
        >
          {children}
        </SelectPrimitives.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitives.Content>
    </SelectPrimitives.Portal>
  ),
)

SelectContent.displayName = "SelectContent"

const SelectGroupLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitives.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitives.Label>
>(({ className, ...props }, forwardedRef) => (
  <SelectPrimitives.Label
    ref={forwardedRef}
    className={cx(
      // base
      "text-label-xs px-3 py-2",
      // text color
      "text-foreground-secondary",
      className,
    )}
    {...props}
  />
))

SelectGroupLabel.displayName = "SelectGroupLabel"

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitives.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitives.Item>
>(({ className, children, ...props }, forwardedRef) => {
  return (
    <SelectPrimitives.Item
      ref={forwardedRef}
      className={cx(
        // base
        "data-[state=checked]: sm:text-label-md grid cursor-pointer grid-cols-[1fr_20px] gap-x-2 rounded px-3 py-2 transition-colors outline-none",
        // text color
        "text-foreground-primary",
        // disabled
        "data-[disabled]:text-foreground-placeholder data-[disabled]:pointer-events-none data-[disabled]:hover:bg-none",
        // focus
        "focus-visible:bg-surface-neutral-secondary",
        // hover
        "hover:bg-surface-neutral-secondary",
        className,
      )}
      {...props}
    >
      <SelectPrimitives.ItemText className="flex-1 truncate">
        {children}
      </SelectPrimitives.ItemText>
      <SelectPrimitives.ItemIndicator>
        <RiCheckLine
          className="text-foreground-primary size-5 shrink-0"
          aria-hidden="true"
        />
      </SelectPrimitives.ItemIndicator>
    </SelectPrimitives.Item>
  )
})

SelectItem.displayName = "SelectItem"

const SelectItemPeriod = React.forwardRef<
  React.ElementRef<typeof SelectPrimitives.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitives.Item> & {
    period?: DateRange | undefined
  }
>(({ className, children, period, ...props }, forwardedRef) => {
  return (
    <SelectPrimitives.Item
      ref={forwardedRef}
      className={cx(
        // base
        "data-[state=checked]: sm:text-label-md relative flex cursor-pointer items-center rounded py-2 pr-3 pl-8 transition-colors outline-none",
        // text color
        "text-foreground-primary",
        // disabled
        "data-[disabled]:text-foreground-placeholder data-[disabled]:pointer-events-none data-[disabled]:hover:bg-none",
        // focus
        "focus-visible:bg-surface-neutral-secondary",
        // hover
        "hover:bg-surface-neutral-secondary",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitives.ItemIndicator>
          <RiCheckLine
            className="text-foreground-primary size-5 shrink-0"
            aria-hidden="true"
          />
        </SelectPrimitives.ItemIndicator>
      </span>
      <div className="flex w-full items-center">
        {/* adapt width accordingly if you use longer names for periods */}
        <span className="w-40 sm:w-32">
          <SelectPrimitives.ItemText>{children}</SelectPrimitives.ItemText>
        </span>
        <span>
          {period?.from && period?.to && (
            <span className="text-foreground-placeholder font-normal whitespace-nowrap">
              {format(period.from, "MMM d, yyyy")} –{" "}
              {format(period.to, "MMM d, yyyy")}
            </span>
          )}
        </span>
      </div>
    </SelectPrimitives.Item>
  )
})

SelectItemPeriod.displayName = "SelectItemPeriod"

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitives.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitives.Separator>
>(({ className, ...props }, forwardedRef) => (
  <SelectPrimitives.Separator
    ref={forwardedRef}
    className={cx(
      // base
      "-mx-1 my-1 h-px",
      // background color
      "bg-border-default",
      className,
    )}
    {...props}
  />
))

SelectSeparator.displayName = "SelectSeparator"

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectItemPeriod,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
