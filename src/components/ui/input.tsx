import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-7 w-full min-w-0 rounded-lg bg-surface-3 px-2.5 text-body-compact shadow-xs ring-1 ring-foreground/[0.06] transition-[box-shadow,background-color] duration-80 outline-none hover:ring-foreground/[0.12] placeholder:text-muted-foreground focus-visible:ring-focus-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/50 file:inline-flex file:h-5 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
