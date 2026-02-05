"use client"

// Tremor RadioGroup [v1.0.0]

import * as RadioGroupPrimitives from "@radix-ui/react-radio-group"
import { AnimatePresence, motion } from "framer-motion"
import React from "react"

import { cx, focusRing } from "@/shared/lib/utils"

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

const RADIO_SELECTED_DEFAULT =
  "https://www.figma.com/api/mcp/asset/a94aa0e3-041e-4492-8b9a-7eff7aa2d589"
const RADIO_SELECTED_DISABLED =
  "https://www.figma.com/api/mcp/asset/ffc5b61d-9e00-4571-a593-86f6e6247147"

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitives.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitives.Item>
>(({ className, ...props }, forwardedRef) => {
  const isDisabled = Boolean(props.disabled)
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
              <motion.img
                key="radio-selected"
                alt=""
                className="size-full"
                src={isDisabled ? RADIO_SELECTED_DISABLED : RADIO_SELECTED_DEFAULT}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
              />
            )}
          </AnimatePresence>
        </span>
      </div>
    </RadioGroupPrimitives.Item>
  )
})

RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
