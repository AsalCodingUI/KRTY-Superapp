// Tremor Raw Dialog [v0.0.0]

import * as DialogPrimitives from "@radix-ui/react-dialog"
import React from "react"
import { motion } from "framer-motion"

import { cx, focusRing } from "@/shared/lib/utils"
import { RiCloseLine } from "@/shared/ui/lucide-icons"

/**
 * Dialog component for modal windows and popups.
 * Built on Radix UI Dialog primitives with custom styling.
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogTrigger asChild>
 *     <Button>Open Dialog</Button>
 *   </DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Are you sure?</DialogTitle>
 *     </DialogHeader>
 *     <DialogBody>
 *       <p>Confirm this action to proceed.</p>
 *     </DialogBody>
 *     <DialogFooter>
 *       <DialogClose asChild>
 *         <Button variant="secondary">Cancel</Button>
 *       </DialogClose>
 *       <Button variant="destructive">Confirm</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 */
const Dialog = (
  props: React.ComponentPropsWithoutRef<typeof DialogPrimitives.Root>,
) => {
  return <DialogPrimitives.Root {...props} />
}
Dialog.displayName = "Dialog"

const DialogTrigger = DialogPrimitives.Trigger

const DialogClose = DialogPrimitives.Close

const DialogPortal = DialogPrimitives.Portal

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitives.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Overlay>
>(({ className, ...props }, forwardedRef) => {
  return (
    <DialogPrimitives.Overlay asChild>
      <motion.div
        ref={forwardedRef}
        className={cx(
          // base
          "fixed inset-0 z-50 overflow-y-auto",
          // background color
          "bg-surface-neutral-secondary/60",
          className,
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        {...props}
      />
    </DialogPrimitives.Overlay>
  )
})

DialogOverlay.displayName = "DialogOverlay"

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Content>
>(({ className, ...props }, forwardedRef) => {
  return (
    <DialogPortal>
      <DialogOverlay>
        <DialogPrimitives.Content asChild>
          <motion.div
            ref={forwardedRef}
            className={cx(
              // base
              "fixed left-1/2 top-1/2 z-50 flex w-full max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-neutral-primary bg-surface-neutral-primary shadow-regular-md",
              className,
            )}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            {...props}
          />
        </DialogPrimitives.Content>
      </DialogOverlay>
    </DialogPortal>
  )
})

DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cx(
        "relative flex flex-col gap-y-1 px-xl pb-lg pt-xl",
        className,
      )}
      {...props}
    />
  )
}

DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Title>
>(({ className, ...props }, forwardedRef) => (
  <DialogPrimitives.Title
    ref={forwardedRef}
    className={cx(
      // base
      "text-heading-sm",
      // text color
      "text-foreground-primary",
      className,
    )}
    {...props}
  />
))

DialogTitle.displayName = "DialogTitle"

const DialogDescription = () => null

DialogDescription.displayName = "DialogDescription"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cx(
        "flex items-center justify-end gap-sm px-xl pb-xl pt-lg",
        className,
      )}
      {...props}
    />
  )
}

DialogFooter.displayName = "DialogFooter"

const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cx("px-xl py-lg", className)} {...props} />
}

DialogBody.displayName = "DialogBody"

const DialogCloseButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Close>
>(({ className, ...props }, forwardedRef) => (
  <DialogPrimitives.Close
    ref={forwardedRef}
    className={cx(
      "absolute right-[var(--padding-xl)] top-[var(--padding-xl)] inline-flex items-center justify-center rounded-md p-md text-foreground-tertiary transition-colors hover:bg-surface-neutral-secondary",
      focusRing,
      className,
    )}
    {...props}
  >
    <RiCloseLine className="size-[14px]" />
  </DialogPrimitives.Close>
))

DialogCloseButton.displayName = "DialogCloseButton"

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogBody,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}
