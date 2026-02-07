// Custom Select [v0.0.0]

import * as SelectPrimitives from "@radix-ui/react-select"
import { RiArrowDownSLine, RiArrowUpSLine, RiCheckLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import React from "react"

import { cx, hasErrorInput } from "@/shared/lib/utils"
import { DateRange } from "react-day-picker"
import { buttonVariants } from "@/shared/ui/action/Button"

const Select = SelectPrimitives.Root

const SelectGroup = SelectPrimitives.Group

const SelectValue = SelectPrimitives.Value

const selectTriggerBase = cx(
  // base layout
  "group/trigger flex w-full items-center justify-between gap-sm truncate select-none",
  // text color
  "text-foreground-primary",
  // placeholder
  "data-[placeholder]:text-foreground-tertiary",
)

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitives.Trigger> & {
    hasError?: boolean
    size?: "default" | "sm"
  }
>(({ className, hasError, size = "default", children, ...props }, forwardedRef) => {
  return (
    <SelectPrimitives.Trigger
      ref={forwardedRef}
      className={cx(
        buttonVariants({ variant: "secondary", size }),
        selectTriggerBase,
        hasError ? hasErrorInput : "",
        className,
      )}
      {...props}
    >
      <span className="inline-flex items-center px-xs truncate">
        {children}
      </span>
    <SelectPrimitives.Icon asChild>
      <RiArrowDownSLine
        className={cx(
          // base
          "size-[14px] shrink-0",
          // text color
          "text-foreground-tertiary",
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
          "relative z-50 overflow-hidden rounded-md border",
          // widths
          "max-w-[95vw] min-w-[calc(var(--radix-select-trigger-width)-2px)]",
          // heights
          "max-h-[--radix-select-content-available-height]",
          // background color
          "bg-surface-neutral-primary",
          // text color
          "text-foreground-secondary",
          // border color
          "border-neutral-primary",
          // shadow
          "shadow-[0px_2px_4px_-3px_rgba(0,0,0,0.08),0px_10px_24px_-6px_rgba(0,0,0,0.08)]",
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
            "py-xs",
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
      "text-label-xs px-xl py-sm",
      // text color
      "text-foreground-tertiary",
      className,
    )}
    {...props}
  />
))

SelectGroupLabel.displayName = "SelectGroupLabel"

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitives.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitives.Item> & {
    leadingIcon?: React.ReactNode
  }
>(({ className, children, leadingIcon, ...props }, forwardedRef) => {
  return (
    <SelectPrimitives.Item
      ref={forwardedRef}
      className={cx(
        // base
        "group/item px-sm py-xs outline-none",
        // text color
        "text-foreground-secondary",
        // disabled
        "data-[disabled]:text-foreground-disable data-[disabled]:pointer-events-none",
        className,
      )}
      {...props}
    >
      <div
        className={cx(
          "flex w-full items-center gap-lg rounded-md px-xl py-lg transition-colors",
          "group-data-[highlighted]/item:bg-surface-neutral-secondary",
          "group-data-[state=checked]/item:bg-surface-neutral-secondary",
        )}
      >
        {leadingIcon ? (
          <span className="flex size-5 items-center justify-center">
            {leadingIcon}
          </span>
        ) : null}
        <SelectPrimitives.ItemText className="text-label-sm text-foreground-secondary flex-1 truncate">
          {children}
        </SelectPrimitives.ItemText>
        <SelectPrimitives.ItemIndicator>
          <RiCheckLine
            className="text-foreground-secondary size-4 shrink-0"
            aria-hidden="true"
          />
        </SelectPrimitives.ItemIndicator>
      </div>
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
        "group/item px-sm py-xs outline-none",
        // text color
        "text-foreground-secondary",
        // disabled
        "data-[disabled]:text-foreground-disable data-[disabled]:pointer-events-none",
        className,
      )}
      {...props}
    >
      <div
        className={cx(
          "flex w-full items-center gap-lg rounded-md px-xl py-lg transition-colors",
          "group-data-[highlighted]/item:bg-surface-neutral-secondary",
          "group-data-[state=checked]/item:bg-surface-neutral-secondary",
        )}
      >
        <div className="flex w-full items-center gap-lg">
          <SelectPrimitives.ItemText className="text-label-sm text-foreground-secondary w-40 truncate sm:w-32">
            {children}
          </SelectPrimitives.ItemText>
          <span>
            {period?.from && period?.to && (
              <span className="text-foreground-tertiary text-body-xs whitespace-nowrap">
                {format(period.from, "MMM d, yyyy")} –{" "}
                {format(period.to, "MMM d, yyyy")}
              </span>
            )}
          </span>
        </div>
        <SelectPrimitives.ItemIndicator>
          <RiCheckLine
            className="text-foreground-secondary size-4 shrink-0"
            aria-hidden="true"
          />
        </SelectPrimitives.ItemIndicator>
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
      "mx-sm my-xs h-px",
      // background color
      "bg-border-neutral-primary",
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
