import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-1.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "border-primary/25 bg-primary/12 text-primary [a]:hover:bg-primary/20",
        secondary:
          "bg-foreground/[0.07] text-muted-foreground [a]:hover:bg-foreground/10",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive focus-visible:ring-destructive/20 [a]:hover:bg-destructive/15",
        outline:
          "border-border text-muted-foreground [a]:hover:bg-muted [a]:hover:text-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "border-success/20 bg-success/10 text-success [a]:hover:bg-success/15",
        warning:
          "border-warning/20 bg-warning/10 text-warning [a]:hover:bg-warning/15",
        info: "border-info/20 bg-info/10 text-info [a]:hover:bg-info/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
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
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
