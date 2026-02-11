// Tremor DropdownMenu [v1.0.0] - Full version

"use client"

import * as DropdownMenuPrimitives from "@radix-ui/react-dropdown-menu"
import { RiCheckLine } from "@/shared/ui/lucide-icons"
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
      "group/item px-0 py-[2px] outline-none select-none",
      "text-foreground-secondary",
      "data-[disabled]:text-foreground-disable data-[disabled]:pointer-events-none",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    <div
      className={cx(
        "flex h-[28px] w-full items-center gap-sm rounded-[8px] px-[8px] py-[4px] transition-colors",
        "group-data-[highlighted]/item:bg-surface-neutral-secondary",
        "group-data-[state=open]/item:bg-surface-neutral-secondary",
      )}
    >
      <span className="text-label-sm text-foreground-secondary flex-1 truncate">
        {children}
      </span>
      <span className="ml-auto">
        <svg
          className="size-[14px] text-foreground-secondary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </span>
    </div>
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
        "relative z-50 min-w-48 overflow-hidden rounded-md border p-[2px]",
        "bg-surface-neutral-primary text-foreground-secondary border-neutral-primary",
        "shadow-[0px_2px_4px_-3px_rgba(0,0,0,0.08),0px_10px_24px_-6px_rgba(0,0,0,0.08)]",
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
        "relative z-50 min-w-32 overflow-hidden rounded-md border p-[2px]",
        "bg-surface-neutral-primary text-foreground-secondary border-neutral-primary",
        "shadow-[0px_2px_4px_-3px_rgba(0,0,0,0.08),0px_10px_24px_-6px_rgba(0,0,0,0.08)]",
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
      "group/item px-0 py-[2px] outline-none select-none",
      "text-foreground-secondary",
      "data-[disabled]:text-foreground-disable data-[disabled]:pointer-events-none",
      className,
    )}
    {...props}
  >
    <div
      className={cx(
        "flex h-[28px] w-full items-center gap-sm rounded-[8px] px-[8px] py-[4px] transition-colors",
        "group-data-[highlighted]/item:bg-surface-neutral-secondary",
      )}
    >
      <span className="text-label-sm text-foreground-secondary flex-1 truncate">
        {props.children}
      </span>
    </div>
  </DropdownMenuPrimitives.Item>
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitives.RadioItem
    ref={ref}
    className={cx(
      "group/item px-0 py-[2px] outline-none select-none",
      "text-foreground-secondary",
      "data-[disabled]:text-foreground-disable data-[disabled]:pointer-events-none",
      className,
    )}
    {...props}
  >
    <div
      className={cx(
        "flex h-[28px] w-full items-center gap-sm rounded-[8px] px-[8px] py-[4px] transition-colors",
        "group-data-[highlighted]/item:bg-surface-neutral-secondary",
        "group-data-[state=checked]/item:bg-surface-neutral-secondary",
      )}
    >
      <span className="text-label-sm text-foreground-secondary flex-1 truncate">
        {children}
      </span>
      <DropdownMenuPrimitives.ItemIndicator>
        <RiCheckLine className="text-foreground-secondary size-[14px] shrink-0" />
      </DropdownMenuPrimitives.ItemIndicator>
    </div>
  </DropdownMenuPrimitives.RadioItem>
))
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitives.Separator
    ref={ref}
    className={cx("bg-border-neutral-primary mx-sm my-xs h-px", className)}
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
    className={cx("text-label-xs px-xl py-sm text-foreground-tertiary", className)}
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
