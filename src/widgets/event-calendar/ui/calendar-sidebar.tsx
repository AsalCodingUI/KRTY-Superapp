"use client"

import { cx } from "@/shared/lib/utils"
import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiEyeLine,
  RiEyeOffLine,
  RiGoogleFill,
  RiLoader4Line,
} from "@remixicon/react"
import { useEventVisibility } from "./hooks/use-event-visibility"
import { useGoogleCalendar } from "./hooks/use-google-calendar"
import { MiniCalendar } from "./mini-calendar"

export function CalendarSidebar() {
  const { categories, toggleColor } = useEventVisibility()
  const { isConnected, isLoading } = useGoogleCalendar()

  return (
    <div className="bg-surface hidden h-full w-64 flex-shrink-0 overflow-y-auto lg:block">
      <div className="space-y-6">
        {/* Mini Calendar */}
        <MiniCalendar />

        {/* Event Categories */}
        <div className="">
          <h4 className="text-label-md text-content mb-3">Kretya Calendar</h4>
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleColor(category.color)}
                className="text-body-sm hover:bg-muted flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors"
              >
                {/* Color indicator - solid circle */}
                <span
                  className={cx(
                    "h-2.5 w-2.5 flex-shrink-0 rounded-full",
                    `bg-${category.color}-500`,
                  )}
                />

                {/* Label */}
                <span className="text-content text-body-sm flex-1 break-words">
                  {category.name}
                </span>

                {/* Eye icon - show/hide */}
                {category.isActive ? (
                  <RiEyeLine className="text-content-muted h-4 w-4 flex-shrink-0" />
                ) : (
                  <RiEyeOffLine className="text-content-muted h-4 w-4 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Connect Calendar */}
        <div className="">
          <h4 className="text-label-md text-content mb-3">Connect Calendar</h4>
          <div className="space-y-2">
            <div className="flex w-full cursor-default items-center gap-2.5 rounded-md px-2.5 py-2">
              {/* Google Calendar Icon */}
              <RiGoogleFill className="text-content-muted h-4 w-4 flex-shrink-0" />

              {/* Label */}
              <span className="text-body-sm text-content flex-1 text-left">
                Google Calendar
              </span>

              {/* Status Icon */}
              {isLoading ? (
                <RiLoader4Line className="text-content-muted h-4 w-4 flex-shrink-0 animate-spin" />
              ) : isConnected ? (
                <RiCheckboxCircleLine className="text-success h-4 w-4 flex-shrink-0" />
              ) : (
                <RiCloseCircleLine className="text-content-muted h-4 w-4 flex-shrink-0" />
              )}
            </div>

            {/* Status Text */}
            <div className="px-2.5">
              <span
                className={cx(
                  "text-body-xs",
                  isConnected ? "text-success" : "text-content-muted",
                )}
              ></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
