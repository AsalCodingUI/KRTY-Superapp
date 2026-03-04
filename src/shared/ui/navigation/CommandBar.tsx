"use client"

import * as Popover from "@radix-ui/react-popover"
import * as React from "react"

import { cx } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/action/Button"

const shortcutStyles = cx(
  "hidden h-5 items-center justify-center rounded px-1.5 text-body-xs font-medium transition select-none sm:flex",
  "bg-surface-inverse-secondary text-foreground-on-color",
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
        "text-foreground-on-color text-body-sm px-3 py-2 tabular-nums font-medium",
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
        "relative flex items-center gap-x-0.5 rounded-xl px-1 py-1",
        "bg-surface-inverse-primary",
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
      className={cx("h-4 w-px mx-1 bg-surface-inverse-secondary", className)}
      {...props}
    />
  )
})
CommandBarSeperator.displayName = "CommandBar.Seperator"

interface CommandProps extends Omit<
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
      <button
        ref={ref}
        type="button"
        onClick={action}
        disabled={disabled}
        aria-label={label}
        className={cx(
          buttonVariants({ variant: "tertiaryInverse", size: "sm" }),
          "gap-x-1.5",
          className,
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
    )
  },
)
CommandBarCommand.displayName = "CommandBar.Command"

export {
  CommandBar,
  CommandBarBar,
  CommandBarCommand,
  CommandBarSeperator,
  CommandBarValue
}

