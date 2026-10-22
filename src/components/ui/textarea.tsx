import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "bg-field hover:bg-field-hover hover:border-field-border-hover placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-focus-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 border-field-border flex field-sizing-content min-h-16 w-full resize-none rounded-md border px-2.5 py-2 text-base transition-[color,box-shadow] duration-200 outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 md:text-sm",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
