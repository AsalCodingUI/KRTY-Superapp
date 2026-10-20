import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full px-2 text-caption leading-5 whitespace-nowrap transition-colors duration-80 focus-visible:ring-1 focus-visible:ring-focus-ring has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/90",
        secondary:
          "bg-foreground/5 text-muted-foreground dark:bg-white/5 [a]:hover:bg-foreground/10",
        destructive:
          "bg-destructive/8 text-destructive dark:bg-destructive/10 [a]:hover:bg-destructive/15",
        outline:
          "text-foreground ring-1 ring-inset ring-foreground/10 [a]:hover:bg-hover",
        ghost: "hover:bg-hover hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        success:
          "bg-success/8 text-success dark:bg-success/5 [a]:hover:bg-success/15",
        warning:
          "bg-warning/8 text-warning dark:bg-warning/5 [a]:hover:bg-warning/15",
        info: "bg-info/8 text-info dark:bg-info/5 [a]:hover:bg-info/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
