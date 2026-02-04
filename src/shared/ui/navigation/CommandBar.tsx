"use client"

import * as Popover from "@radix-ui/react-popover"
import * as React from "react"

import { cx, focusRing } from "@/shared/lib/utils"

const shortcutStyles = cx(
  "bg-surface-neutral-secondary text-foreground-secondary ring-border-default hidden h-6 items-center justify-center rounded-md px-2 font-mono text-xs ring-1 transition select-none ring-inset sm:flex",
)

interface CommandBarProps extends React.PropsWithChildren {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  disableAutoFocus?: boolean
}

/**
 * CommandBar component for quick actions and navigation.
 * Built on Radix UI Popover primitive.
 *
 * @example
 * ```tsx
 * <CommandBar open={isOpen} onOpenChange={setIsOpen}>
 *   <CommandBarBar>
 *     <CommandBarCommand label="Copy" action={() => {}} shortcut={{ shortcut: "c" }} />
 *   </CommandBarBar>
 * </CommandBar>
 * ```
 */
const CommandBar = ({
  open = false,
  onOpenChange,
  defaultOpen = false,
  disableAutoFocus = true,
  children,
}: CommandBarProps) => {
  return (
    <Popover.Root
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={defaultOpen}
    >
      <Popover.Anchor
        className={cx(
          "fixed inset-x-0 bottom-8 mx-auto flex w-fit items-center",
        )}
      />
      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={0}
          onOpenAutoFocus={(e) => {
            if (disableAutoFocus) {
              e.preventDefault()
            }
          }}
          className={cx(
            "z-50",
            "data-[state=closed]:animate-hide",
            "data-[side=top]:animate-slideUpAndFade",
          )}
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
CommandBar.displayName = "CommandBar"

const CommandBarValue = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cx(
        "text-foreground-secondary px-3 py-2.5 text-sm tabular-nums",
        className,
      )}
      {...props}
    />
  )
})
CommandBarValue.displayName = "CommandBar.Value"

const CommandBarBar = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cx(
        "bg-surface border-border-default relative flex items-center rounded-lg border px-1 shadow-md",
        className,
      )}
      {...props}
    />
  )
})
CommandBarBar.displayName = "CommandBarBar"

const CommandBarSeperator = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentPropsWithoutRef<"div">, "children">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cx("h-4 w-px bg-white/20", className)}
      {...props}
    />
  )
})
CommandBarSeperator.displayName = "CommandBar.Seperator"

interface CommandProps
  extends Omit<
    React.ComponentPropsWithoutRef<"button">,
    "children" | "onClick"
  > {
  action: () => void | Promise<void>
  label: string
  shortcut: { shortcut: string; label?: string }
}

const CommandBarCommand = React.forwardRef<HTMLButtonElement, CommandProps>(
  (
    {
      className,
      type = "button",
      label,
      action,
      shortcut,
      disabled,
      ...props
    }: CommandProps,
    ref,
  ) => {
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === shortcut.shortcut) {
          event.preventDefault()
          event.stopPropagation()
          action()
        }
      }

      if (!disabled) {
        document.addEventListener("keydown", handleKeyDown)
      }

      return () => {
        document.removeEventListener("keydown", handleKeyDown)
      }
    }, [action, shortcut, disabled])

    return (
      <span
        className={cx(
          "bg-surface text-foreground-primary flex items-center gap-x-2 rounded-lg p-1 text-base font-medium transition outline-none focus:z-10 sm:text-sm",
          "sm:last-of-type:-mr-1",
          className,
        )}
      >
        <button
          ref={ref}
          type={type}
          onClick={action}
          disabled={disabled}
          aria-label={label}
          className={cx(
            // base
            "hover:bg-surface-neutral-secondary flex items-center gap-x-2 rounded-md px-1 py-1",
            // focus
            "focus-visible:bg-surface-neutral-secondary focus-visible:hover:bg-surface-neutral-secondary",
            "disabled:text-foreground-disable",
            focusRing,
          )}
          {...props}
        >
          <span>{label}</span>
          <span className={shortcutStyles}>
            {shortcut.label
              ? shortcut.label.toUpperCase()
              : shortcut.shortcut.toUpperCase()}
          </span>
        </button>
      </span>
    )
  },
)
CommandBarCommand.displayName = "CommandBar.Command"

export {
  CommandBar,
  CommandBarBar,
  CommandBarCommand,
  CommandBarSeperator,
  CommandBarValue,
}
