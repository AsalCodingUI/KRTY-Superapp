// Tremor Raw Label [v0.0.0]

import * as LabelPrimitives from "@radix-ui/react-label"
import * as React from "react"

import { cx } from '@/shared/lib/utils'

interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitives.Root> {
  disabled?: boolean
}

/**
 * Label component for form inputs.
 * 
 * @example
 * ```tsx
 * <Label htmlFor="email">Email Address</Label>
 * <Input id="email" type="email" />
 * ```
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitives.Root>,
  CheckboxProps
>(({ className, disabled, ...props }, forwardedRef) => (
  <LabelPrimitives.Root
    ref={forwardedRef}
    className={cx(
      // base
      "text-sm leading-none",
      // text color
      "text-content dark:text-content",
      // disabled
      {
        "text-content-placeholder dark:text-content-subtle": disabled,
      },
      className,
    )}
    aria-disabled={disabled}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
