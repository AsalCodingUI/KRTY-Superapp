// Tremor Raw Checkbox [v0.0.2]

"use client"

import * as CheckboxPrimitives from "@radix-ui/react-checkbox"
import { AnimatePresence, motion } from "framer-motion"
import React from "react"

import { cx, focusRing } from "@/shared/lib/utils"
import { RiCheckLine, RiSubtractFill } from "@/shared/ui/lucide-icons"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitives.Root>
>(({ className, checked, ...props }, forwardedRef) => {
  const isControlled = checked !== undefined
  const [internalChecked, setInternalChecked] = React.useState<
    CheckboxPrimitives.CheckedState
  >(props.defaultChecked ?? false)
  const currentChecked = isControlled ? checked : internalChecked
  const isChecked = currentChecked === true
  const isIndeterminate = currentChecked === "indeterminate"
  return (
    <CheckboxPrimitives.Root
      ref={forwardedRef}
      {...props}
      checked={checked}
      defaultChecked={isControlled ? undefined : props.defaultChecked}
      onCheckedChange={(next) => {
        if (!isControlled) {
          setInternalChecked(next)
        }
        props.onCheckedChange?.(next)
      }}
      className={cx(
        // base
        "group relative inline-flex size-5 shrink-0 appearance-none items-center justify-center align-middle leading-none outline-none enabled:cursor-pointer",
        // text color
        "text-foreground-on-color data-[disabled]:text-foreground-disable",
        // disabled
        "data-[disabled]:cursor-not-allowed",
        // focus
        focusRing,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "absolute inset-[1px] rounded-sm border border-neutral-secondary bg-surface-neutral-primary transition",
          "group-data-[state=unchecked]:group-data-[disabled]:border-neutral-disable",
          "group-data-[state=checked]:group-data-[disabled]:border-transparent",
          "group-data-[state=indeterminate]:group-data-[disabled]:border-transparent",
          "group-data-[state=checked]:border-transparent group-data-[state=checked]:bg-surface-brand",
          "group-data-[state=indeterminate]:border-transparent group-data-[state=indeterminate]:bg-surface-brand",
          "group-data-[state=checked]:shadow-[0px_3px_6px_-2px_rgba(2,123,255,0.08),0px_2px_4px_-2px_rgba(2,123,255,0.12)]",
          "group-data-[state=indeterminate]:shadow-[0px_3px_6px_-2px_rgba(2,123,255,0.08),0px_2px_4px_-2px_rgba(2,123,255,0.12)]",
          "group-data-[disabled]:bg-surface-state-neutral-light-disable",
          "group-data-[disabled]:group-data-[state=checked]:bg-surface-state-neutral-light-disable",
          "group-data-[disabled]:group-data-[state=indeterminate]:bg-surface-state-neutral-light-disable",
          "group-data-[disabled]:group-data-[state=unchecked]:bg-surface-state-neutral-light-disable",
          "group-data-[disabled]:shadow-none",
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "absolute inset-0 rounded-[inherit] opacity-0 transition",
            "group-data-[state=checked]:opacity-100 group-data-[state=indeterminate]:opacity-100",
            "group-data-[disabled]:opacity-0",
          )}
        />
      </span>
      <CheckboxPrimitives.Indicator
        asChild
        className="relative z-10 flex size-full items-center justify-center"
      >
        <motion.span
          className="relative flex size-[14px] items-center justify-center"
          initial={false}
          animate={{
            scale: isChecked || isIndeterminate ? 1 : 0.8,
            opacity: isChecked || isIndeterminate ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 720, damping: 44, mass: 0.6 }}
        >
          <AnimatePresence initial={false} mode="wait">
            {isChecked && (
              <motion.span
                key="checkbox-check"
                className="flex size-[14px] items-center justify-center text-current"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 720,
                  damping: 44,
                  mass: 0.6,
                }}
              >
                <RiCheckLine className="size-[14px] text-current" />
              </motion.span>
            )}
            {isIndeterminate && (
              <motion.span
                key="checkbox-minus"
                className="flex size-[14px] items-center justify-center text-current"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 720,
                  damping: 44,
                  mass: 0.6,
                }}
              >
                <RiSubtractFill className="size-[14px] text-current" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.span>
      </CheckboxPrimitives.Indicator>
    </CheckboxPrimitives.Root>
  )
})

Checkbox.displayName = "Checkbox"

export { Checkbox }
