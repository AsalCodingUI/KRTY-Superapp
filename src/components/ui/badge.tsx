import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-1.5 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,background-color,filter,box-shadow] focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/15 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary [a]:hover:bg-primary/25",
        secondary: "bg-neutral-subtle text-neutral-ink [a]:hover:brightness-95",
        destructive:
          "bg-destructive-subtle text-red-11 focus-visible:ring-destructive/20 [a]:hover:brightness-95",
        outline:
          "bg-transparent text-foreground/60 shadow-[inset_0_0_0_1px_var(--border)] [a]:hover:bg-foreground/[0.05]",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success-subtle text-green-11 [a]:hover:brightness-95",
        warning: "bg-warning-subtle text-amber-11 [a]:hover:brightness-95",
        info: "bg-info-subtle text-blue-11 [a]:hover:brightness-95",
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
