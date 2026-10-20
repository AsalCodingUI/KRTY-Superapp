import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border border-transparent px-1.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/15 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary [a]:hover:bg-primary/25",
        secondary:
          "bg-foreground/[0.07] text-foreground/60 [a]:hover:bg-foreground/[0.1]",
        destructive:
          "bg-destructive/15 text-destructive focus-visible:ring-destructive/20 [a]:hover:bg-destructive/25",
        outline:
          "bg-transparent text-foreground/60 shadow-[inset_0_0_0_1px_var(--border)] [a]:hover:bg-foreground/[0.05]",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success/15 text-success [a]:hover:bg-success/25",
        warning: "bg-warning/15 text-warning [a]:hover:bg-warning/25",
        info: "bg-info/15 text-info [a]:hover:bg-info/25",
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
