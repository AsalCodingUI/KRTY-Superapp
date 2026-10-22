"use client"

import { cx } from "@/shared/lib/utils"
import { Button } from "@/components/ui/button"
import {
  RiCloseLine,
  RiEqualizer2Line,
  RiEyeLine,
  RiEyeOffLine,
} from "@/shared/ui/lucide-icons"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"
import { useEventVisibility } from "./hooks/use-event-visibility"
import { MiniCalendar } from "./mini-calendar"
import type { EventColor } from "./types"

const CATEGORY_DOT_CLASSES: Record<EventColor, string> = {
  blue: "bg-primary",
  violet: "bg-primary",
  emerald: "bg-success",
  rose: "bg-destructive",
  orange: "bg-warning",
  amber: "bg-warning",
  cyan: "bg-primary",
  neutral: "bg-muted-foreground",
}

const MOBILE_BOTTOM_SHEET_CLASSNAME =
  "z-[80] h-[80vh] overflow-hidden rounded-t-[24px] border-t p-0"

function SidebarContent() {
  const { categories, toggleColor } = useEventVisibility()
  return (
    <div className="flex flex-col items-start gap-3">
      <MiniCalendar />

      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center py-1.5">
          <h4 className="text-muted-foreground text-sm font-medium">
            Kalender Kretya
          </h4>
        </div>
        <div className="flex w-full flex-col gap-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => toggleColor(category.color)}
              className="text-muted-foreground hover:bg-accent flex w-full items-center gap-1 overflow-hidden rounded-md px-2 py-1 text-left text-sm font-medium transition-colors"
            >
              <span className="flex size-4 shrink-0 items-center justify-center">
                <span
                  className={cx(
                    "size-2 rounded-[3px]",
                    CATEGORY_DOT_CLASSES[category.color],
                  )}
                />
              </span>
              <span className="flex-1 px-0.5 text-current">
                {category.name}
              </span>
              {category.isActive ? (
                <RiEyeLine className="text-tertiary-foreground size-4 shrink-0" />
              ) : (
                <RiEyeOffLine className="text-tertiary-foreground size-4 shrink-0" />
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
    <div className="hidden h-full w-[220px] flex-shrink-0 overflow-y-auto lg:block">
      <SidebarContent />
    </div>
  )
}

export function CalendarSidebarMobileTrigger() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            className="shadow-lg lg:hidden"
            aria-label="Buka filter kalender"
          />
        }
      >
        <RiEqualizer2Line className="size-4" />
        <span>Atur</span>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={MOBILE_BOTTOM_SHEET_CLASSNAME}
      >
        <SheetTitle className="sr-only">Kalender</SheetTitle>
        <div className="border-border flex items-center justify-between border-b px-4 py-4">
          <h3 className="text-foreground text-base font-semibold">Kalender</h3>
          <SheetClose
            render={
              <button
                type="button"
                className="text-tertiary-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-full transition-colors"
                aria-label="Tutup panel kalender"
              />
            }
          >
            <RiCloseLine className="size-6" />
          </SheetClose>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-6">
          <SidebarContent />
        </div>
      </SheetContent>
    </Sheet>
  )
}
