import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  /** `sm` (h-7) for rows and toolbars, like `SelectTrigger size="sm"`. */
  size?: "default" | "sm"
}

function Input({ className, type, size = "default", ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(
        "bg-field hover:bg-field-hover hover:border-field-border-hover file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-focus-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 border-field-border rounded-control w-full min-w-0 border px-3 py-1 text-base transition-[color,box-shadow] duration-200 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 md:text-sm",
        size === "sm" ? "h-7" : "h-8",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
