// Tremor Raw Textarea [v0.0.1]

import { tv } from "@/shared/lib/utils/tv"
import React from "react"
import type { VariantProps } from "tailwind-variants"

import { cx, focusInput, hasErrorInput } from "@/shared/lib/utils"

const textareaStyles = tv({
  base: [
    // base
    "text-body-sm flex min-h-[80px] w-full appearance-none truncate rounded-md border px-2.5 py-1.5 transition outline-none",
    // border color
    "border-border-default",
    // text color
    "text-foreground-primary",
    // placeholder color
    "placeholder-foreground-placeholder",
    // background color
    "bg-surface",
    // disabled
    "disabled:border-border-default disabled:text-foreground-placeholder",
    // file
    [
      "file:-my-2 file:-ml-2.5 file:cursor-pointer file:rounded-l-[5px] file:rounded-r-none file:border-0 file:px-3 file:py-2 file:outline-none focus:outline-none disabled:pointer-events-none file:disabled:pointer-events-none",
      "file:border-border-default file:bg-surface-neutral-secondary file:text-foreground-secondary file:hover:bg-surface-neutral-tertiary file:disabled:border-border-disable file:border-solid",
      "file:[margin-inline-end:0.75rem] file:[border-inline-end-width:1px]",
      "file:disabled:bg-surface-neutral-tertiary file:disabled:text-foreground-disable",
    ],
    // focus
    focusInput,
    // invalid (optional)
    // "aria-[invalid=true]:dark:ring-red-400/20 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-200 aria-[invalid=true]:border-red-500 invalid:ring-2 invalid:ring-red-200 invalid:border-red-500"
  ],
  variants: {
    hasError: {
      true: hasErrorInput,
    },
  },
})

interface TextareaProps
  extends
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaStyles> {
  inputClassName?: string
}

/**
 * Textarea component with built-in styling and error states.
 *
 * @example
 * ```tsx
 * <Textarea placeholder="Type your message here..." />
 * ```
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, ...props }: TextareaProps, forwardedRef) => {
    return (
      <textarea
        ref={forwardedRef}
        className={cx(textareaStyles({ hasError }), className)}
        {...props}
      />
    )
  },
)

Textarea.displayName = "Textarea"

export { Textarea, textareaStyles, type TextareaProps }
