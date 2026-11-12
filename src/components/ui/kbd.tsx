import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        // Outline only, no fill: a see-through white stroke on dark (black
        // on light so it stays visible on white); in tooltips the tooltip's
        // ink at 25%).
        "text-muted-foreground in-data-[slot=tooltip-content]:border-background/25 in-data-[slot=tooltip-content]:text-background pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm border border-black/10 bg-transparent px-1 font-sans text-xs font-medium select-none dark:border-white/15 [&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
