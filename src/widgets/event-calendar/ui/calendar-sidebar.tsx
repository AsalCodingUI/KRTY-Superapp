"use client"

import { cx } from "@/shared/lib/utils"
import { Button } from "@/shared/ui"
import {
  RiCloseLine,
  RiEqualizer2Line,
  RiEyeLine,
  RiEyeOffLine,
} from "@/shared/ui/lucide-icons"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/overlay/Drawer"
import { useState } from "react"
import { useEventVisibility } from "./hooks/use-event-visibility"
import { MiniCalendar } from "./mini-calendar"
import type { EventColor } from "./types"

const CATEGORY_DOT_CLASSES: Record<EventColor, string> = {
  blue: "bg-surface-brand",
  violet: "bg-surface-brand",
  emerald: "bg-surface-success",
  rose: "bg-surface-danger",
  orange: "bg-surface-warning",
  amber: "bg-surface-warning",
  cyan: "bg-surface-brand",
  neutral: "bg-surface-neutral-secondary",
}

const MOBILE_BOTTOM_SHEET_CLASSNAME =
  "top-auto right-0 bottom-0 left-0 z-[80] mx-0 h-[80vh] w-full max-w-none overflow-hidden rounded-t-[24px] rounded-b-none border-x-0 border-b-0 p-0 max-sm:inset-x-0 sm:inset-y-auto sm:top-auto sm:right-0 sm:bottom-0 sm:left-0 sm:h-[80vh] sm:max-w-none sm:w-full sm:p-0 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full"

function SidebarContent() {
  const { categories, toggleColor } = useEventVisibility()
  return (
    <div className="flex flex-col items-start gap-lg">
      <MiniCalendar />

      <div className="flex w-full flex-col gap-lg">
        <div className="flex items-center py-md">
          <h4 className="text-label-sm text-foreground-secondary">
            Kretya Calendar
          </h4>
        </div>
        <div className="flex w-full flex-col gap-sm">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => toggleColor(category.color)}
              className="text-label-sm text-foreground-secondary hover:bg-surface-state-neutral-light-hover flex w-full items-center gap-sm overflow-hidden rounded-md px-lg py-sm text-left transition-colors"
            >
              <span className="flex size-4 shrink-0 items-center justify-center">
                <span
                  className={cx(
                    "size-2 rounded-full border border-neutral-white",
                    CATEGORY_DOT_CLASSES[category.color],
                  )}
                />
              </span>
              <span className="flex-1 px-xs text-current">
                {category.name}
              </span>
              {category.isActive ? (
                <RiEyeLine className="text-foreground-tertiary size-4 shrink-0" />
              ) : (
                <RiEyeOffLine className="text-foreground-tertiary size-4 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CalendarSidebar() {
  return (
    <div className="bg-surface hidden h-full w-[220px] flex-shrink-0 overflow-y-auto lg:block">
      <SidebarContent />
    </div>
  )
}

export function CalendarSidebarMobileTrigger() {
  const [open, setOpen] = useState(false)
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full shadow-regular-lg lg:hidden"
          aria-label="Open calendar filters"
        >
          <RiEqualizer2Line className="size-4" />
          <span>Adjust</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className={MOBILE_BOTTOM_SHEET_CLASSNAME}>
        <DrawerTitle className="sr-only">Calendar</DrawerTitle>
        <div className="border-neutral-primary flex items-center justify-between border-b px-4 py-4">
          <h3 className="text-heading-sm text-foreground-primary">Calendar</h3>
          <DrawerClose asChild>
            <button
              type="button"
              className="text-foreground-tertiary hover:text-foreground-primary inline-flex size-8 items-center justify-center rounded-full transition-colors"
              aria-label="Close calendar drawer"
            >
              <RiCloseLine className="size-6" />
            </button>
          </DrawerClose>
        </div>
        <DrawerBody className="overflow-y-auto px-4 py-4 pb-6">
          <SidebarContent />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
