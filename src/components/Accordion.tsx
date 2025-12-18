// src/components/Accordion.tsx

import * as AccordionPrimitives from "@radix-ui/react-accordion"
import { RiArrowDownSLine } from "@remixicon/react"
import React from "react"

import { cx, focusRing } from "@/lib/utils"

const Accordion = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitives.Root>
>(({ className, ...props }, forwardedRef) => (
    <AccordionPrimitives.Root
        ref={forwardedRef}
        className={cx("space-y-2", className)}
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
            "overflow-hidden rounded-md border",
            // border color
            "border-border",
            // background color
            "bg-surface dark:bg-surface",
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
                "group flex flex-1 cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-medium transition-all",
                // text color
                "text-content dark:text-content",
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
                    "text-content-placeholder dark:text-content-subtle",
                )}
            // FIX: Menghapus aria-hidden untuk menghindari error tipe data
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
            "overflow-hidden text-sm transition-all",
            "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        )}
        {...props}
    >
        <div
            className={cx(
                // base - removed border-t for clean table rendering
                "px-4 pb-4 pt-2 text-content-subtle dark:text-content-placeholder",
                className,
            )}
        >
            {children}
        </div>
    </AccordionPrimitives.Content>
))

AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
