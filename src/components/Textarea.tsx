// Tremor Raw Textarea [v0.0.1]

import React from "react"
import { tv, type VariantProps } from "tailwind-variants"

import { cx, focusInput, hasErrorInput } from "@/lib/utils"

const textareaStyles = tv({
    base: [
        // base
        "flex min-h-[80px] w-full appearance-none truncate rounded-md border px-2.5 py-1.5 outline-none transition text-sm",
        // border color
        "border-border",
        // text color
        "text-content dark:text-content",
        // placeholder color
        "placeholder-zinc-400 dark:placeholder-zinc-500",
        // background color
        "bg-surface dark:bg-surface",
        // disabled
        "disabled:border-border disabled:text-content-placeholder",
        "disabled:dark:border disabled:dark:text-content-subtle",
        // file
        [
            "file:-my-2 file:-ml-2.5 file:cursor-pointer file:rounded-l-[5px] file:rounded-r-none file:border-0 file:px-3 file:py-2 file:outline-none focus:outline-none disabled:pointer-events-none file:disabled:pointer-events-none",
            "file:border-solid file:border-border file:bg-muted file:text-content-subtle file:hover:bg-muted file:disabled:border-border-subtle",
            "file:[border-inline-end-width:1px] file:[margin-inline-end:0.75rem]",
            "file:disabled:bg-muted file:disabled:text-content-subtle file:disabled:dark:bg-hover",
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
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaStyles> {
    inputClassName?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        { className, hasError, ...props }: TextareaProps,
        forwardedRef,
    ) => {
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
