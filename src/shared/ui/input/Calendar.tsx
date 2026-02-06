// Tremor Raw Calendar [v0.0.4]

"use client"

import {
  RiArrowLeftDoubleLine,
  RiArrowLeftSLine,
  RiArrowDownSLine,
  RiArrowRightDoubleLine,
  RiArrowRightSLine,
} from "@/shared/ui/lucide-icons"
import { addYears, format, isSameMonth } from "date-fns"
import * as React from "react"
import {
  DayPicker,
  useDayPicker,
  useDayRender,
  useNavigation,
  type DayPickerRangeProps,
  type DayPickerSingleProps,
  type DayProps,
  type Matcher,
} from "react-day-picker"

import { cx, focusRing } from "@/shared/lib/utils"

interface NavigationButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  onClick: () => void
  icon: React.ElementType
  disabled?: boolean
}

const NavigationButton = React.forwardRef<
  HTMLButtonElement,
  NavigationButtonProps
>(
  (
    { onClick, icon, disabled, ...props }: NavigationButtonProps,
    forwardedRef,
  ) => {
    const Icon = icon
    return (
      <button
        ref={forwardedRef}
        type="button"
        disabled={disabled}
        className={cx(
          "flex size-8 shrink-0 items-center justify-center rounded-[10px] p-2 transition outline-none select-none",
          // text color
          "text-foreground-secondary hover:text-foreground-primary",
          // background color
          "hover:bg-surface-state-neutral-light-hover",
          // disabled
          "disabled:pointer-events-none",
          "disabled:text-foreground-disable",
          focusRing,
        )}
        onClick={onClick}
        {...props}
      >
        <Icon className="size-3.5 shrink-0" />
      </button>
    )
  },
)

NavigationButton.displayName = "NavigationButton"

type OmitKeys<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P]
}

type KeysToOmit = "showWeekNumber" | "captionLayout" | "mode"

type SingleProps = OmitKeys<DayPickerSingleProps, KeysToOmit>
type RangeProps = OmitKeys<DayPickerRangeProps, KeysToOmit>

type CalendarProps =
  | ({
      mode: "single"
    } & SingleProps)
  | ({
      mode?: undefined
    } & SingleProps)
  | ({
      mode: "range"
    } & RangeProps)

/**
 * Calendar component for date selection.
 * Built on React Day Picker.
 *
 * @example
 * ```tsx
 * <Calendar mode="single" selected={date} onSelect={setDate} />
 * ```
 */
const Calendar = ({
  mode = "single",
  weekStartsOn = 1,
  numberOfMonths = 1,
  enableYearNavigation = false,
  disableNavigation,
  locale,
  className,
  classNames,
  ...props
}: CalendarProps & { enableYearNavigation?: boolean }) => {
  return (
    <DayPicker
      mode={mode}
      weekStartsOn={weekStartsOn}
      numberOfMonths={numberOfMonths}
      locale={locale}
      showOutsideDays
      className={cx(
        "bg-surface-neutral-primary border border-neutral-secondary rounded-xl shadow-regular-md",
        "overflow-hidden",
        className,
      )}
      classNames={{
        months:
          numberOfMonths > 1
            ? "flex flex-row gap-0"
            : "flex flex-col gap-0",
        month: "space-y-3 p-3",
        nav: "hidden",
        table: "w-full border-separate border-spacing-2",
        head_row: "h-8",
        head_cell:
          "h-8 w-8 p-0 text-label-sm text-foreground-secondary text-center",
        row: "w-full",
        cell: cx(
          "relative p-0 text-center focus-within:relative",
        ),
        day: cx(
          "text-label-sm font-medium text-foreground-secondary",
          "size-8 rounded-md focus:z-10",
          "hover:bg-surface-state-neutral-light-hover",
          focusRing,
        ),
        day_today: "font-medium",
        day_selected:
          mode === "range"
            ? "text-foreground-secondary"
            : "bg-surface-brand text-foreground-on-color",
        day_disabled:
          "text-foreground-disable disabled:hover:bg-transparent",
        day_outside: "text-foreground-disable",
        day_range_middle: cx(
          "!rounded-none",
          "aria-selected:!bg-surface-brand-light aria-selected:!text-foreground-secondary",
        ),
        day_range_start:
          "rounded-md border border-border-brand !bg-transparent !text-foreground-secondary",
        day_range_end:
          "rounded-md border border-border-brand !bg-transparent !text-foreground-secondary",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => (
          <RiArrowLeftSLine aria-hidden="true" className="size-4" />
        ),
        IconRight: () => (
          <RiArrowRightSLine aria-hidden="true" className="size-4" />
        ),
        Caption: ({ ...props }) => {
          const {
            goToMonth,
            nextMonth,
            previousMonth,
            currentMonth,
            displayMonths,
          } = useNavigation()
          const { numberOfMonths, fromDate, toDate } = useDayPicker()

          const displayIndex = displayMonths.findIndex((month) =>
            isSameMonth(props.displayMonth, month),
          )
          const isFirst = displayIndex === 0
          const isLast = displayIndex === displayMonths.length - 1

          const hideNextButton = numberOfMonths > 1 && (isFirst || !isLast)
          const hidePreviousButton = numberOfMonths > 1 && (isLast || !isFirst)

          const goToPreviousYear = () => {
            const targetMonth = addYears(currentMonth, -1)
            if (
              previousMonth &&
              (!fromDate || targetMonth.getTime() >= fromDate.getTime())
            ) {
              goToMonth(targetMonth)
            }
          }

          const goToNextYear = () => {
            const targetMonth = addYears(currentMonth, 1)
            if (
              nextMonth &&
              (!toDate || targetMonth.getTime() <= toDate.getTime())
            ) {
              goToMonth(targetMonth)
            }
          }

          return (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {enableYearNavigation && !hidePreviousButton && (
                  <NavigationButton
                    disabled={
                      disableNavigation ||
                      !previousMonth ||
                      (fromDate &&
                        addYears(currentMonth, -1).getTime() <
                          fromDate.getTime())
                    }
                    aria-label="Go to previous year"
                    onClick={goToPreviousYear}
                    icon={RiArrowLeftDoubleLine}
                  />
                )}
                {!hidePreviousButton ? (
                  <NavigationButton
                    disabled={disableNavigation || !previousMonth}
                    aria-label="Go to previous month"
                    onClick={() => previousMonth && goToMonth(previousMonth)}
                    icon={RiArrowLeftSLine}
                  />
                ) : (
                  <span className="size-8" />
                )}
              </div>

              <div
                role="presentation"
                aria-live="polite"
                className="flex flex-1 items-center justify-center gap-3"
              >
                <div className="flex items-center gap-1">
                  <span className="text-label-md text-foreground-secondary text-center tracking-[-0.112px]">
                    {format(props.displayMonth, "LLL, yyyy", { locale })}
                  </span>
                  <button
                    type="button"
                    className={cx(
                      "flex size-6 items-center justify-center rounded-md",
                      "hover:bg-surface-state-neutral-light-hover",
                      focusRing,
                    )}
                    aria-label="Select month"
                  >
                    <RiArrowDownSLine className="size-3.5 text-foreground-secondary" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-label-md text-foreground-secondary text-center tracking-[-0.112px]">
                    {format(props.displayMonth, "yyyy", { locale })}
                  </span>
                  <button
                    type="button"
                    className={cx(
                      "flex size-6 items-center justify-center rounded-md",
                      "hover:bg-surface-state-neutral-light-hover",
                      focusRing,
                    )}
                    aria-label="Select year"
                  >
                    <RiArrowDownSLine className="size-3.5 text-foreground-secondary" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!hideNextButton ? (
                  <NavigationButton
                    disabled={disableNavigation || !nextMonth}
                    aria-label="Go to next month"
                    onClick={() => nextMonth && goToMonth(nextMonth)}
                    icon={RiArrowRightSLine}
                  />
                ) : (
                  <span className="size-8" />
                )}
                {enableYearNavigation && !hideNextButton && (
                  <NavigationButton
                    disabled={
                      disableNavigation ||
                      !nextMonth ||
                      (toDate &&
                        addYears(currentMonth, 1).getTime() > toDate.getTime())
                    }
                    aria-label="Go to next year"
                    onClick={goToNextYear}
                    icon={RiArrowRightDoubleLine}
                  />
                )}
              </div>
            </div>
          )
        },
        Day: ({ date, displayMonth }: DayProps) => {
          const buttonRef = React.useRef<HTMLButtonElement>(null)
          const { buttonProps, divProps, isButton, isHidden } = useDayRender(
            date,
            displayMonth,
            buttonRef as React.RefObject<HTMLButtonElement>,
          )

          if (isHidden) {
            return <></>
          }

          if (!isButton) {
            return (
              <div
                {...divProps}
                className={cx(
                  "flex items-center justify-center",
                  divProps.className,
                )}
              />
            )
          }

          const {
            children: buttonChildren,
            className: buttonClassName,
            ...buttonPropsRest
          } = buttonProps

          return (
            <button
              ref={buttonRef}
              {...buttonPropsRest}
              type="button"
              className={cx("relative", buttonClassName)}
            >
              {buttonChildren}
            </button>
          )
        },
      }}
      {...(props as SingleProps & RangeProps)}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar, type Matcher }
