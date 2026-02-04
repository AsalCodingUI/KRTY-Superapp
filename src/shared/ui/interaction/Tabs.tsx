"use client"

// Tremor Tabs [v1.0.0]

import * as TabsPrimitives from "@radix-ui/react-tabs"
import React from "react"

import { cx, focusRing } from "@/shared/lib/utils"

/**
 * Tabs component for switching between views.
 * Built on Radix UI Tabs primitive.
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Account</TabsTrigger>
 *     <TabsTrigger value="tab2">Password</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Account info</TabsContent>
 *   <TabsContent value="tab2">Change password</TabsContent>
 * </Tabs>
 * ```
 */
const Tabs = (
  props: Omit<
    React.ComponentPropsWithoutRef<typeof TabsPrimitives.Root>,
    "orientation"
  >,
) => {
  return <TabsPrimitives.Root tremor-id="tremor-raw" {...props} />
}

Tabs.displayName = "Tabs"

type TabsListVariant = "line" | "solid"

const TabsListVariantContext = React.createContext<TabsListVariant>("line")

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitives.List> {
  variant?: TabsListVariant
}

const variantStyles: Record<TabsListVariant, string> = {
  line: cx(
    // base
    "flex items-center justify-start border-b",
    // border color
    "border-border-default",
  ),
  solid: cx(
    // base
    "inline-flex items-center justify-center rounded-md p-1",
    // background color
    "bg-surface-neutral-secondary",
  ),
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.List>,
  TabsListProps
>(({ className, variant = "line", children, ...props }, forwardedRef) => (
  <TabsPrimitives.List
    ref={forwardedRef}
    className={cx(variantStyles[variant], className)}
    {...props}
  >
    <TabsListVariantContext.Provider value={variant}>
      {children}
    </TabsListVariantContext.Provider>
  </TabsPrimitives.List>
))

TabsList.displayName = "TabsList"

function getVariantStyles(tabVariant: TabsListVariant) {
  switch (tabVariant) {
    case "line":
      return cx(
        // base
        "-mb-px items-center justify-center border-b-2 border-transparent px-3 pb-2 text-sm font-medium whitespace-nowrap transition-all",
        // text color
        "text-foreground-tertiary",
        // hover
        "hover:text-foreground-primary",
        // border hover
        "hover:border-border-brand-light",
        // selected
        "data-[state=active]:border-border-brand data-[state=active]:text-foreground-primary",
        // disabled
        "data-disabled:pointer-events-none",
        "data-disabled:text-foreground-disable",
      )
    case "solid":
      return cx(
        // base
        "inline-flex items-center justify-center rounded-sm px-3 py-1 text-sm font-medium whitespace-nowrap ring-1 transition-all ring-inset",
        // text color
        "text-foreground-tertiary",
        // hover
        "hover:text-foreground-primary",
        // ring
        "ring-transparent",
        // selected
        "data-[state=active]:bg-surface data-[state=active]:text-foreground-primary data-[state=active]:shadow-sm",
        // disabled
        "data-disabled:text-foreground-disable data-disabled:pointer-events-none data-disabled:opacity-50",
      )
    case "solid":
      return cx(
        // base
        "inline-flex items-center justify-center rounded-sm px-3 py-1 text-sm font-medium whitespace-nowrap ring-1 transition-all ring-inset",
        // text color
        "text-content-subtle",
        // hover
        "hover:text-content",
        // ring
        "ring-transparent",
        // selected
        "data-[state=active]:bg-surface data-[state=active]:text-content data-[state=active]:shadow-sm-border",
        // disabled
        "data-disabled:text-content-disabled data-disabled:pointer-events-none data-disabled:opacity-50",
      )
  }
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.Trigger>
>(({ className, children, ...props }, forwardedRef) => {
  const variant = React.useContext(TabsListVariantContext)
  return (
    <TabsPrimitives.Trigger
      ref={forwardedRef}
      className={cx(getVariantStyles(variant), focusRing, className)}
      {...props}
    >
      {children}
    </TabsPrimitives.Trigger>
  )
})

TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.Content>
>(({ className, ...props }, forwardedRef) => (
  <TabsPrimitives.Content
    ref={forwardedRef}
    className={cx("outline-hidden", focusRing, className)}
    {...props}
  />
))

TabsContent.displayName = "TabsContent"

export { Tabs, TabsContent, TabsList, TabsTrigger }
