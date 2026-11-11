"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"

import { Button } from "@/components/ui/button"
import { X as XIcon } from "@/components/icons"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "bg-backdrop fixed inset-0 z-50 transition-opacity duration-300 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0",
        className,
      )}
      {...props}
    />
  )
}

/* A right sheet floats inside the page sheet with one 8px gap on top, right
 * and bottom: below the tab row, and (from md, where the page sits 6px in
 * from the window) 6 + 8 = 14px from the window's right and bottom. Its
 * corner is the page sheet's (rounded-lg): --nest-r is that plus the 8px
 * gap, so rounded-nested lands on it. */
/* `floating` on a left sheet: the right sheet's card, mirrored (8px from
 * the window's left, over the sidebar; same top and bottom as the right
 * one). Notifications open this way, from the bell in the sidebar. */
const FLOATING_LEFT =
  "data-[side=left]:top-(--app-sheet-top) data-[side=left]:bottom-2 data-[side=left]:left-2 data-[side=left]:h-auto data-[side=left]:w-[calc(100%-1rem)] data-[side=left]:border-r-0 data-[side=left]:rounded-nested data-[side=left]:overflow-hidden data-[side=left]:[--nest-p:0.5rem] data-[side=left]:[--nest-r:calc(var(--radius-lg)+0.5rem*var(--corner-k,1))] data-[side=left]:data-ending-style:translate-x-[-1.5rem] data-[side=left]:data-starting-style:translate-x-[-1.5rem] data-[side=left]:sm:max-w-md md:data-[side=left]:bottom-[14px]"

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  floating = false,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
  /** Left sheets only: float as a card like the right ones. */
  floating?: boolean
}) {
  const t = useT("common")
  return (
    <SheetPortal>
      {/* The right panel floats over the page like a card (Voicenotes):
          the page stays visible, so no dimming behind it. It sits inside the
          page sheet with an even 8px gap on top, right and bottom, its
          corners the page sheet's own (see FLOATING_LEFT's note). */}
      <SheetOverlay
        className={
          side === "right" || (side === "left" && floating)
            ? "bg-transparent"
            : undefined
        }
      />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "bg-popover text-popover-foreground ease-drawer data-[side=right]:rounded-nested shadow-dialog fixed z-50 flex flex-col bg-clip-padding text-sm transition-[opacity,translate,transform] duration-[400ms] data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:top-(--app-sheet-top) data-[side=right]:right-2 data-[side=right]:bottom-2 data-[side=right]:w-[calc(100%-1rem)] data-[side=right]:overflow-hidden data-[side=right]:[--nest-p:0.5rem] data-[side=right]:[--nest-r:calc(var(--radius-lg)+0.5rem*var(--corner-k,1))] data-[side=right]:data-ending-style:translate-x-[1.5rem] data-[side=right]:data-starting-style:translate-x-[1.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-md md:data-[side=right]:right-[14px] md:data-[side=right]:bottom-[14px]",
          side === "left" && floating && FLOATING_LEFT,
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground absolute top-3 right-3"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">{t("close")}</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      // A bar: title on the left, the close button sits in the corner.
      className={cn(
        "border-border flex min-h-[3.25rem] shrink-0 items-center gap-2 border-b px-5 pr-14",
        className,
      )}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "border-border mt-auto flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3",
        className,
      )}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-heading text-title font-medium",
        className,
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
