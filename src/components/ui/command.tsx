"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "cn"
import { useT } from "@/shared/i18n/client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search as SearchIcon, Check as CheckIcon } from "@/components/icons"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "bg-popover text-popover-foreground nest-rounded-2xl nest-p-2 flex size-full flex-col overflow-hidden",
        className,
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title,
  description,
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  children: React.ReactNode
}) {
  const t = useT("shell")
  return (
    <Dialog {...props}>
      <DialogContent
        bare
        className={cn(
          "top-[14vh] flex max-h-[min(560px,76svh)] translate-y-0 flex-col overflow-hidden p-0 sm:max-w-[600px] sm:rounded-2xl!",
          className,
        )}
        showCloseButton={showCloseButton}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title ?? t("commandTitle")}</DialogTitle>
          <DialogDescription>
            {description ?? t("commandDescription")}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  trailing,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input> & {
  /** Shown at the end of the field, e.g. a spinner or clear button. */
  trailing?: React.ReactNode
}) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-12 shrink-0 items-center gap-2.5 px-4"
    >
      <SearchIcon className="text-muted-foreground size-[18px] shrink-0" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "placeholder:text-muted-foreground h-full w-full min-w-0 border-0 bg-transparent p-0 text-[15px] shadow-none outline-hidden focus:shadow-none focus:ring-0 focus:outline-hidden focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      {trailing}
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
        className,
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "text-foreground **:[[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [--nest-p:calc(var(--spacing)*3)] **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium",
        className,
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-border/50 my-1 h-px", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item data-selected:bg-muted data-selected:text-foreground data-selected:*:[svg]:text-foreground rounded-nested relative flex min-h-8 cursor-default items-center gap-2 px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "text-muted-foreground group-data-selected/command-item:text-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
