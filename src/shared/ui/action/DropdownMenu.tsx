// Tremor DropdownMenu [v1.0.0] - Full version

"use client"

import * as DropdownMenuPrimitives from "@radix-ui/react-dropdown-menu"
import { RiCheckLine } from "@remixicon/react"
import * as React from "react"

import { cx } from "@/shared/lib/utils"

const DropdownMenu = DropdownMenuPrimitives.Root
DropdownMenu.displayName = "DropdownMenu"

const DropdownMenuTrigger = DropdownMenuPrimitives.Trigger
const DropdownMenuGroup = DropdownMenuPrimitives.Group
const DropdownMenuSub = DropdownMenuPrimitives.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitives.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitives.SubTrigger
    ref={ref}
    className={cx(
      "text-body-sm relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 outline-hidden transition-colors select-none",
      "text-foreground-primary",
      "focus:bg-surface-neutral-secondary",
      "data-[state=open]:bg-surface-neutral-secondary",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <span className="ml-auto">
      <svg
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </span>
  </DropdownMenuPrimitives.SubTrigger>
))
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <DropdownMenuPrimitives.Portal>
    <DropdownMenuPrimitives.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cx(
        "shadow-md-border z-50 min-w-48 overflow-hidden rounded-md p-1",
        "bg-surface",
        "animate-in fade-in-80",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitives.Portal>
))
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuSubMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitives.Portal>
    <DropdownMenuPrimitives.SubContent
      ref={ref}
      className={cx(
        "shadow-md-border z-50 min-w-32 overflow-hidden rounded-md p-1",
        "bg-surface",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitives.Portal>
))
DropdownMenuSubMenuContent.displayName = "DropdownMenuSubMenuContent"

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitives.Item
    ref={ref}
    className={cx(
      "text-body-sm relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 outline-hidden transition-colors select-none",
      "text-foreground-primary",
      "focus:bg-surface-neutral-secondary",
      "data-disabled:pointer-events-none data-disabled:opacity-50",
      className,
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitives.RadioItem
    ref={ref}
    className={cx(
      "text-body-sm relative flex cursor-pointer items-center rounded-sm py-1.5 pr-2 pl-8 outline-hidden transition-colors select-none",
      "text-foreground-primary",
      "focus:bg-surface-neutral-secondary",
      "data-disabled:pointer-events-none data-disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <DropdownMenuPrimitives.ItemIndicator>
        <RiCheckLine className="size-4" />
      </DropdownMenuPrimitives.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitives.RadioItem>
))
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitives.Separator
    ref={ref}
    className={cx("bg-border-default -mx-1 my-1 h-px", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitives.Label
    ref={ref}
    className={cx("text-label-md px-2 py-1.5", className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubMenuContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
