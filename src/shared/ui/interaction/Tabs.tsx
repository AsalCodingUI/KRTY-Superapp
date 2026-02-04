"use client"

// Tremor Tabs [v1.0.0]

import * as TabsPrimitives from "@radix-ui/react-tabs"
import { motion } from "framer-motion"
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
type TabsValueContextValue = {
  value: string | undefined
  layoutId: string
}

const TabsValueContext = React.createContext<TabsValueContextValue | null>(null)

const Tabs = (
  props: Omit<
    React.ComponentPropsWithoutRef<typeof TabsPrimitives.Root>,
    "orientation"
  >,
) => {
  const { value, defaultValue, onValueChange, ...rest } = props
  const [uncontrolledValue, setUncontrolledValue] = React.useState<
    string | undefined
  >(defaultValue)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : uncontrolledValue
  const layoutId = React.useId()

  const handleValueChange = (next: string) => {
    if (!isControlled) {
      setUncontrolledValue(next)
    }
    onValueChange?.(next)
  }

  return (
    <TabsValueContext.Provider value={{ value: currentValue, layoutId }}>
      <TabsPrimitives.Root
        tremor-id="tremor-raw"
        value={currentValue}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        {...rest}
      />
    </TabsValueContext.Provider>
  )
}

Tabs.displayName = "Tabs"

type TabsListVariant = "line" | "solid"

const TabsListVariantContext = React.createContext<TabsListVariant>("line")

interface TabsListProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitives.List
> {
  variant?: TabsListVariant
}

const variantStyles: Record<TabsListVariant, string> = {
  line: cx(
    // base
    "flex items-start justify-start gap-sm border-b",
    // border color
    "border-neutral-primary",
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
        "group relative inline-flex items-center justify-center whitespace-nowrap px-sm pb-lg transition-all",
        // border (active only)
        "data-[state=active]:rounded-md",
        // text color
        "text-foreground-secondary",
        // hover
        "hover:text-foreground-primary",
        // selected
        "data-[state=active]:text-foreground-primary",
        // disabled
        "data-disabled:pointer-events-none data-disabled:text-foreground-disable",
      )
    case "solid":
      return cx(
        // base
        "text-label-md inline-flex items-center justify-center rounded-sm px-3 py-1 whitespace-nowrap ring-1 transition-all ring-inset",
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
  }
}

type TabsTriggerProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitives.Trigger
> & {
  leadingIcon?: React.ReactNode
  showLeadingIcon?: boolean
  badge?: React.ReactNode
  showBadge?: boolean
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.Trigger>,
  TabsTriggerProps
>(
  (
    {
      className,
      children,
      leadingIcon,
      showLeadingIcon = true,
      badge,
      showBadge = true,
      ...props
    },
    forwardedRef,
  ) => {
  const variant = React.useContext(TabsListVariantContext)
  const tabsContext = React.useContext(TabsValueContext)
  const isActive =
    tabsContext?.value !== undefined && tabsContext?.value === props.value

  const hasLeadingIcon = showLeadingIcon && Boolean(leadingIcon)
  const hasBadge = showBadge && badge !== undefined && badge !== null

  const renderIcon = (icon?: React.ReactNode) => {
    if (!icon) return null
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement, {
        className: cx("size-3.5 shrink-0 text-current", icon.props.className),
        "aria-hidden": true,
      })
    }
    return icon
  }

  return (
    <TabsPrimitives.Trigger
      ref={forwardedRef}
      className={cx(getVariantStyles(variant), focusRing, className)}
      {...props}
    >
      {variant === "line" ? (
        <>
          <span
            className={cx(
              "inline-flex items-center justify-center gap-xs rounded-md bg-surface-neutral-primary px-lg py-sm",
              "group-hover:shadow-neutral group-data-[state=active]:shadow-neutral",
            )}
          >
            {hasLeadingIcon && (
              <span className="flex shrink-0 items-center justify-center text-current">
                {renderIcon(leadingIcon)}
              </span>
            )}
            <span className="text-label-md px-xs text-current">{children}</span>
            {hasBadge && (
              <span className="bg-surface-brand text-foreground-on-color text-label-xs flex min-w-[20px] items-center justify-center rounded-full px-md py-xs">
                {badge}
              </span>
            )}
          </span>
          {isActive && tabsContext?.layoutId ? (
            <motion.span
              layoutId={`tabs-underline-${tabsContext.layoutId}`}
              className="absolute inset-x-0 -bottom-px h-px bg-surface-brand"
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
            />
          ) : null}
        </>
      ) : (
        <span className="inline-flex items-center justify-center gap-2">
          {hasLeadingIcon && (
            <span className="flex shrink-0 items-center justify-center text-current">
              {renderIcon(leadingIcon)}
            </span>
          )}
          <span className="text-label-md">{children}</span>
          {hasBadge && (
            <span className="bg-surface-brand text-foreground-on-color text-label-xs flex min-w-[20px] items-center justify-center rounded-full px-md py-xs">
              {badge}
            </span>
          )}
        </span>
      )}
    </TabsPrimitives.Trigger>
  )
  },
)

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
