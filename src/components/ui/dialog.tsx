"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"
import { useT } from "@/shared/i18n/client"

import { Button } from "@/components/ui/button"
import { X as XIcon } from "@/components/icons"
import {
  DialogSections,
  dialogSheetOnMobileClassName,
  dialogShellClassName,
} from "@/components/ui/dialog-sections"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 bg-backdrop fixed inset-0 isolate z-50 duration-250 ease-out",
        className,
      )}
      {...props}
    />
  )
}

/** Pulled this far down (px), or flicked faster (px/ms), the sheet closes. */
const SHEET_CLOSE_DISTANCE = 120
const SHEET_CLOSE_VELOCITY = 0.6
/** Drags start from the top strip (handle and header), not the body, so
 *  scrolling the content still scrolls. */
const SHEET_GRAB_HEIGHT = 72

/**
 * On a phone, the dialog (a bottom sheet there) follows a finger pulled down
 * from its top strip, and closes past a distance or on a quick flick;
 * otherwise it springs back. Moves the sheet with the `translate` property,
 * so the closing animation (a `transform`) carries on from where it was let
 * go instead of jumping back first.
 */
function useSheetDrag(close: () => void) {
  const closeRef = React.useRef(close)
  closeRef.current = close
  const [node, setNode] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!node) return
    // A sheet reopened while still closing keeps the node: start clean.
    node.style.translate = ""
    node.style.transition = ""
    const phone = window.matchMedia("(max-width: 639px)")
    let start: { y: number; t: number } | null = null
    // The last two samples: the flick speed is measured between them.
    let prev = { y: 0, t: 0 }
    let last = { y: 0, t: 0 }
    let dy = 0

    const interactive = (el: EventTarget | null) =>
      el instanceof Element &&
      Boolean(
        el.closest(
          "button, a, input, textarea, select, label, [contenteditable=true], [tabindex]:not([tabindex='-1']), [role=button], [role=slider], [role=checkbox], [role=switch], [role=tab], [role=combobox], [role=option], [role=menuitem]",
        ),
      )

    const onDown = (e: PointerEvent) => {
      if (!phone.matches || e.button !== 0 || interactive(e.target)) return
      // A sheet that scrolls itself and isn't at the top: the strip is
      // content now, so the finger scrolls instead.
      if (node.scrollTop > 0) return
      if (e.clientY - node.getBoundingClientRect().top > SHEET_GRAB_HEIGHT)
        return
      start = { y: e.clientY, t: e.timeStamp }
      prev = last = { y: e.clientY, t: e.timeStamp }
      dy = 0
      node.style.transition = "none"
      node.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!start) return
      // Up is resisted (a little give), down follows the finger.
      const raw = e.clientY - start.y
      dy = raw > 0 ? raw : -Math.sqrt(-raw) * 2
      node.style.translate = `0 ${dy}px`
      prev = last
      last = { y: e.clientY, t: e.timeStamp }
    }
    const onUp = (e: PointerEvent) => {
      if (!start) return
      const velocity = (e.clientY - prev.y) / Math.max(e.timeStamp - prev.t, 1)
      start = null
      if (
        dy > SHEET_CLOSE_DISTANCE ||
        (dy > 16 && velocity > SHEET_CLOSE_VELOCITY)
      ) {
        // Stay where it was let go; the closing slide continues from there.
        closeRef.current()
        // Still open (an unsaved-changes prompt kept it): settle back.
        window.setTimeout(() => {
          if (node.isConnected && !node.hasAttribute("data-closed")) settle()
        }, 120)
        return
      }
      settle()
    }
    const settle = () => {
      node.style.transition = "translate 320ms cubic-bezier(0.32, 0.72, 0, 1)"
      node.style.translate = ""
    }
    // A finger drag on the strip must not scroll or bounce the page.
    const onTouchMove = (e: TouchEvent) => {
      if (start) e.preventDefault()
    }

    node.addEventListener("pointerdown", onDown)
    node.addEventListener("pointermove", onMove)
    node.addEventListener("pointerup", onUp)
    node.addEventListener("pointercancel", onUp)
    node.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => {
      node.removeEventListener("pointerdown", onDown)
      node.removeEventListener("pointermove", onMove)
      node.removeEventListener("pointerup", onUp)
      node.removeEventListener("pointercancel", onUp)
      node.removeEventListener("touchmove", onTouchMove)
    }
  }, [node])

  return setNode
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  bare = false,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  /** Custom layout (e.g. Settings); skips the header/panel/footer sections. */
  bare?: boolean
}) {
  const t = useT("common")
  // Closing the way the user would: through Base UI's own close control,
  // so onOpenChange (and any unsaved-changes guard) runs as usual.
  const closer = React.useRef<HTMLButtonElement>(null)
  const sheetRef = useSheetDrag(() => closer.current?.click())
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        ref={sheetRef}
        data-slot="dialog-content"
        className={cn(
          bare
            ? "bg-popover text-popover-foreground data-open:animate-in data-open:fade-in-0 data-open:zoom-in-96 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-96 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl text-sm shadow-(--elev-5) duration-250 ease-out outline-none"
            : dialogShellClassName,
          dialogSheetOnMobileClassName,
          className,
        )}
        {...props}
      >
        {bare ? (
          children
        ) : (
          <DialogSections
            isHeader={(el) => el.type === DialogHeader}
            isFooter={(el) => el.type === DialogFooter}
          >
            {children}
          </DialogSections>
        )}
        <DialogPrimitive.Close
          ref={closer}
          tabIndex={-1}
          aria-hidden
          className="hidden"
        />
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground absolute top-3.5 right-3.5"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">{t("close")}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  const t = useT("common")
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          {t("close")}
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-heading text-[15px] leading-snug font-medium",
        className,
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3",
        className,
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
