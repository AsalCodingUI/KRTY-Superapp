"use client"

// Tremor RadioGroup [v1.0.0]

import * as RadioGroupPrimitives from "@radix-ui/react-radio-group"
import { AnimatePresence, motion } from "framer-motion"
import React from "react"

import { cx, focusRing } from "@/shared/lib/utils"
import { RiRadioButtonFill } from "@/shared/ui/lucide-icons"

/**
 * RadioGroup component for single selection.
 * Built on Radix UI RadioGroup primitive.
 *
 * @example
 * ```tsx
 * <RadioGroup defaultValue="option1">
 *   <RadioGroupItem value="option1" />
 *   <Label>Option 1</Label>
 * </RadioGroup>
 * ```
 */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitives.Root>
>(({ className, ...props }, forwardedRef) => {
  return (
    <RadioGroupPrimitives.Root
      ref={forwardedRef}
      className={cx("grid gap-2", className)}
      tremor-id="tremor-raw"
      {...props}
    />
  )
})

RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitives.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitives.Item>
>(({ className, ...props }, forwardedRef) => {
  const itemRef = React.useRef<HTMLButtonElement | null>(null)
  const [isChecked, setIsChecked] = React.useState(false)

  React.useEffect(() => {
    const node = itemRef.current
    if (!node) return
    const sync = () => {
      setIsChecked(node.getAttribute("data-state") === "checked")
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(node, { attributes: true, attributeFilter: ["data-state"] })
    return () => observer.disconnect()
  }, [])
  return (
    <RadioGroupPrimitives.Item
      ref={(node) => {
        itemRef.current = node
        if (typeof forwardedRef === "function") {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      }}
      className={cx(
        "group relative flex size-5 appearance-none items-center justify-center outline-hidden",
        focusRing,
        className,
      )}
      {...props}
    >
      <div className="relative flex size-full items-center justify-center">
        <span
          aria-hidden="true"
          className={cx(
            "absolute inset-[1px] rounded-full border border-neutral-disable bg-surface-neutral-primary transition",
            "group-data-[disabled]:border-neutral-disable group-data-[disabled]:bg-surface-state-neutral-light-disable",
            "group-data-[state=checked]:border-transparent group-data-[state=checked]:bg-transparent",
          )}
        >
          <AnimatePresence initial={false}>
            {isChecked && (
              <motion.span
                key="radio-selected"
                className={cx(
                  "flex size-full items-center justify-center text-foreground-brand",
                  "group-data-[disabled]:text-foreground-disable",
                )}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
              >
                <RiRadioButtonFill className="size-full text-current" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>
    </RadioGroupPrimitives.Item>
  )
})

RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
