import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/*
 * Layered button: the fill lives on a ::before plate (inset 1px, own 1px
 * spread shadow) so hover/active can tween background + ring independently
 * (180ms ring / 80ms fill) without moving the label.
 */
const buttonVariants = cva(
  [
    "group/button relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg outline-none select-none",
    "text-body-compact transition-colors duration-80",
    "before:absolute before:inset-px before:-z-10 before:rounded-[inherit] before:bg-(--btn-bg) before:shadow-[0_0_0_1px_var(--btn-ring,var(--btn-bg))]",
    "before:transition-[box-shadow,background-color] before:[transition-duration:180ms,80ms] before:[transition-timing-function:cubic-bezier(0.23,1,0.32,1),ease]",
    "active:before:[transition-duration:80ms,80ms] active:before:shadow-[0_0_0_0px_var(--btn-ring,var(--btn-bg))]",
    "focus-visible:ring-1 focus-visible:ring-focus-ring",
    "disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-1 aria-invalid:ring-destructive/50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
    "[&_svg]:stroke-[1.5] [&_svg]:transition-[stroke-width] [&_svg]:duration-80 hover:[&_svg]:stroke-[2]",
  ],
  {
    variants: {
      variant: {
        default:
          "text-primary-foreground [--btn-bg:var(--primary)] hover:[--btn-bg:color-mix(in_oklab,var(--primary)_88%,black)] active:[--btn-bg:color-mix(in_oklab,var(--primary)_78%,black)]",
        secondary:
          "text-foreground [--btn-bg:var(--tint)] hover:[--btn-bg:var(--tint-hover)] active:[--btn-bg:var(--tint)] aria-expanded:[--btn-bg:var(--tint-hover)]",
        outline:
          "text-foreground [--btn-bg:var(--surface-3)] [--btn-ring:color-mix(in_oklab,var(--foreground)_8%,transparent)] hover:[--btn-bg:var(--surface-4)] hover:[--btn-ring:color-mix(in_oklab,var(--foreground)_14%,transparent)] aria-expanded:[--btn-bg:var(--surface-4)]",
        ghost:
          "text-muted-foreground hover:text-foreground aria-expanded:text-foreground [--btn-bg:transparent] hover:[--btn-bg:var(--hover)] active:[--btn-bg:var(--active)] aria-expanded:[--btn-bg:var(--active)]",
        destructive:
          "text-white [--btn-bg:var(--destructive)] hover:[--btn-bg:color-mix(in_oklab,var(--destructive)_90%,var(--background))] active:[--btn-bg:color-mix(in_oklab,var(--destructive)_80%,var(--background))]",
        link: "text-foreground underline-offset-4 before:hidden hover:underline",
      },
      size: {
        default:
          "h-7 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        sm: "h-7 gap-1 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 px-2 text-caption-compact has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-8 gap-1.5 px-3.5 text-body has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        icon: "size-7 p-0",
        "icon-xs": "size-6 p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 p-0",
        "icon-lg": "size-8 p-0 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
