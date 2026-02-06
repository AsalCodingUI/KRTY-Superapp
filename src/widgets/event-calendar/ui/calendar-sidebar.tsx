"use client"

import { cx } from "@/shared/lib/utils"
import { RiEyeLine, RiEyeOffLine } from "@/shared/ui/lucide-icons"
import type { EventColor } from "./types"
import { useEventVisibility } from "./hooks/use-event-visibility"
import { MiniCalendar } from "./mini-calendar"

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

export function CalendarSidebar() {
  const { categories, toggleColor } = useEventVisibility()
  return (
    <div className="bg-surface hidden h-full w-[220px] flex-shrink-0 overflow-y-auto lg:block">
      <div className="flex flex-col items-start gap-lg">
        {/* Mini Calendar */}
        <MiniCalendar />

        {/* Event Categories */}
        <div className="flex w-full flex-col gap-md">
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
                {/* Color indicator */}
                <span className="flex size-4 shrink-0 items-center justify-center">
                  <span
                    className={cx(
                      "size-2 rounded-full border border-neutral-white",
                      CATEGORY_DOT_CLASSES[category.color],
                    )}
                  />
                </span>

                {/* Label */}
                <span className="flex-1 px-xs text-current">
                  {category.name}
                </span>

                {/* Eye icon - show/hide */}
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
    </div>
  )
}
