// src/components/Accordion.tsx

import { RiArrowDownSLine } from "@/shared/ui/lucide-icons"
import * as AccordionPrimitives from "@radix-ui/react-accordion"
import React from "react"

import { cx, focusRing } from "@/shared/lib/utils"

/**
 * Accordion component for toggling content visibility.
 * Built on Radix UI Accordion primitive.
 *
 * @example
 * ```tsx
 * <Accordion type="single" collapsible>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Is it accessible?</AccordionTrigger>
 *     <AccordionContent>Yes.</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
const Accordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitives.Root>
>(({ className, ...props }, forwardedRef) => (
  <AccordionPrimitives.Root
    ref={forwardedRef}
    className={cx("space-y-4", className)}
    {...props}
  />
))

Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitives.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitives.Item>
>(({ className, ...props }, forwardedRef) => (
  <AccordionPrimitives.Item
    ref={forwardedRef}
    className={cx(
      // base
      "overflow-hidden rounded-lg border",
      // border color
      "border-neutral-primary",
      // background color
      "bg-surface-neutral-primary",
      className,
    )}
    {...props}
  />
))

AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitives.Trigger>
>(({ className, children, ...props }, forwardedRef) => (
  <AccordionPrimitives.Header className="flex">
    <AccordionPrimitives.Trigger
      ref={forwardedRef}
      className={cx(
        // base
        "group text-label-md flex flex-1 cursor-pointer items-center justify-between px-xl py-lg text-left transition-all",
        // text color
        "text-foreground-primary",
        // disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        focusRing,
        className,
      )}
      {...props}
    >
      {children}
      <RiArrowDownSLine
        className={cx(
          // base
          "size-5 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.87,_0,_0.13,_1)] group-data-[state=open]:-rotate-180",
          // text color
          "text-foreground-secondary",
        )}
        aria-hidden="true"
      />
    </AccordionPrimitives.Trigger>
  </AccordionPrimitives.Header>
))

AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitives.Content>
>(({ className, children, ...props }, forwardedRef) => (
  <AccordionPrimitives.Content
    ref={forwardedRef}
    className={cx(
      "text-body-sm overflow-hidden transition-all",
      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
    )}
    {...props}
  >
    <div
      className={cx(
        // base - removed border-t for clean table rendering
        "text-foreground-tertiary px-xl pb-xl pt-sm",
        className,
      )}
    >
      {children}
    </div>
  </AccordionPrimitives.Content>
))

AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
