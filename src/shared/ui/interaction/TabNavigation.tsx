// Tremor Raw TabNavigation [v0.0.1]
"use client"

import * as NavigationMenuPrimitives from "@radix-ui/react-navigation-menu"
import { motion } from "framer-motion"
import React from "react"

import { cx, focusRing } from "@/shared/lib/utils"

function getSubtree(
  options: { asChild: boolean | undefined; children: React.ReactNode },
  content: React.ReactNode | ((children: React.ReactNode) => React.ReactNode),
) {
  const { asChild, children } = options
  if (!asChild)
    return typeof content === "function" ? content(children) : content

  const firstChild = React.Children.only(children) as any
  return React.cloneElement(firstChild, {
    children:
      typeof content === "function"
        ? content(firstChild.props.children)
        : content,
  })
}

/**
 * TabNavigation component for navigation links.
 * Built on Radix UI NavigationMenu primitive.
 *
 * @example
 * ```tsx
 * <TabNavigation>
 *   <TabNavigationLink href="#" active>Overview</TabNavigationLink>
 *   <TabNavigationLink href="#">Settings</TabNavigationLink>
 * </TabNavigation>
 * ```
 */
const TabNavigationUnderlineContext = React.createContext<string | null>(null)

const TabNavigation = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitives.Root>,
  Omit<
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitives.Root>,
    "orientation" | "defaultValue" | "dir"
  >
>(({ className, children, ...props }, forwardedRef) => {
  const layoutId = React.useId()
  return (
    <NavigationMenuPrimitives.Root ref={forwardedRef} {...props} asChild={false}>
      <NavigationMenuPrimitives.List
        className={cx(
          // base
          "flex items-start justify-start gap-sm border-b whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          // border color
          "border-neutral-primary",
          className,
        )}
      >
        <TabNavigationUnderlineContext.Provider value={layoutId}>
          {children}
        </TabNavigationUnderlineContext.Provider>
      </NavigationMenuPrimitives.List>
    </NavigationMenuPrimitives.Root>
  )
})

TabNavigation.displayName = "TabNavigation"

const TabNavigationLink = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitives.Link>,
  Omit<
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitives.Link>,
    "onSelect"
  > & {
    disabled?: boolean
    active?: boolean
    leadingIcon?: React.ReactNode
    showLeadingIcon?: boolean
    badge?: React.ReactNode
    showBadge?: boolean
  }
>(
  (
    {
      asChild,
      disabled,
      active,
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
    const layoutId = React.useContext(TabNavigationUnderlineContext)
    return (
      <NavigationMenuPrimitives.Item className="flex" aria-disabled={disabled}>
        <NavigationMenuPrimitives.Link
          aria-disabled={disabled}
          data-active={active ? "" : undefined}
          aria-current={active ? "page" : undefined}
          className={cx(
            "group relative flex shrink-0 items-center justify-center select-none",
            disabled ? "pointer-events-none cursor-not-allowed" : "cursor-pointer",
          )}
          ref={forwardedRef}
          onSelect={() => {}}
          asChild={asChild}
          {...props}
        >
          {getSubtree({ asChild, children }, (children) => (
            <span
              className={cx(
                // base
                "relative inline-flex items-center justify-center px-sm pb-lg whitespace-nowrap transition-all",
                // border (active only)
                "group-data-[active]:rounded-md",
                // text color
                "text-foreground-secondary",
                // hover
                "group-hover:text-foreground-primary",
                // selected (active)
                "group-data-[active]:text-foreground-primary",
                // disabled
                disabled ? "text-foreground-disable pointer-events-none" : "",
                focusRing,
                className,
              )}
            >
              {active && layoutId && (
                <motion.span
                  layoutId={`tab-underline-${layoutId}`}
                  className="absolute inset-x-0 -bottom-px z-10 h-px bg-surface-brand"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span
                data-active={active ? "" : undefined}
                className={cx(
                  "inline-flex items-center justify-center gap-xs rounded-md bg-surface-neutral-primary px-lg py-sm border border-transparent shadow-none",
                  "group-hover:bg-surface-state-neutral-light-hover group-hover:border-neutral-primary",
                  "data-[active]:border-neutral-primary",
                )}
              >
                {showLeadingIcon && leadingIcon && (
                  <span className="flex shrink-0 items-center justify-center text-current">
                    {React.isValidElement(leadingIcon)
                      ? React.cloneElement(leadingIcon as React.ReactElement, {
                          className: cx(
                            "size-3.5 shrink-0 text-current",
                            (leadingIcon as any).props?.className,
                          ),
                          "aria-hidden": true,
                        })
                      : leadingIcon}
                  </span>
                )}
                <span className="text-label-md px-xs text-current">
                  {children}
                </span>
                {showBadge && badge !== undefined && badge !== null && (
                  <span className="bg-surface-brand text-foreground-on-color text-label-xs flex min-w-[20px] items-center justify-center rounded-full px-md py-xs">
                    {badge}
                  </span>
                )}
              </span>
            </span>
          ))}
        </NavigationMenuPrimitives.Link>
      </NavigationMenuPrimitives.Item>
    )
  },
)

TabNavigationLink.displayName = "TabNavigationLink"

export { TabNavigation, TabNavigationLink }
