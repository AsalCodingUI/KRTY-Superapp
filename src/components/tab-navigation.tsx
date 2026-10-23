"use client"

import * as React from "react"
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui"

import { SlidingIndicator } from "@/components/sliding-indicator"
import { cn } from "@/lib/utils"

type ElementWithChildren = React.ReactElement<{ children?: React.ReactNode }>

function getSubtree(
  options: { asChild: boolean | undefined; children: React.ReactNode },
  content: (children: React.ReactNode) => React.ReactNode,
) {
  const { asChild, children } = options
  if (!asChild) return content(children)

  const firstChild = React.Children.only(children) as ElementWithChildren
  return React.cloneElement(firstChild, {
    children: content(firstChild.props.children),
  })
}

/**
 * TabNavigation — link-based navigation styled like shadcn line tabs.
 * Built on the Radix NavigationMenu primitive.
 *
 * @example
 * ```tsx
 * <TabNavigation>
 *   <TabNavigationLink href="#" active>Overview</TabNavigationLink>
 *   <TabNavigationLink href="#">Settings</TabNavigationLink>
 * </TabNavigation>
 * ```
 */
const TabNavigation = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Root>,
  Omit<
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>,
    "orientation" | "defaultValue" | "dir"
  >
>(({ className, children, ...props }, forwardedRef) => {
  return (
    <div className="-mb-px overflow-x-auto pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <NavigationMenuPrimitive.Root
        ref={forwardedRef}
        data-slot="tab-navigation"
        {...props}
        asChild={false}
      >
        <NavigationMenuPrimitive.List
          className={cn(
            "border-border relative flex items-start justify-start gap-7 border-b whitespace-nowrap",
            className,
          )}
        >
          {/* One underline that slides to the active tab. */}
          <SlidingIndicator
            activeSelector="[data-active]"
            variant="underline"
            className="bg-primary -mt-px h-0.5"
          />
          {children}
        </NavigationMenuPrimitive.List>
      </NavigationMenuPrimitive.Root>
    </div>
  )
})

TabNavigation.displayName = "TabNavigation"

type TabNavigationLinkProps = Omit<
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>,
  "onSelect"
> & {
  disabled?: boolean
  active?: boolean
  leadingIcon?: React.ReactNode
  showLeadingIcon?: boolean
  badge?: React.ReactNode
  showBadge?: boolean
}

const TabNavigationLink = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Link>,
  TabNavigationLinkProps
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
    return (
      <NavigationMenuPrimitive.Item className="flex" aria-disabled={disabled}>
        <NavigationMenuPrimitive.Link
          aria-disabled={disabled}
          data-active={active ? "" : undefined}
          aria-current={active ? "page" : undefined}
          className={cn(
            "group focus-visible:ring-ring/30 relative flex shrink-0 items-center justify-center rounded-md outline-none select-none focus-visible:ring-3",
            disabled
              ? "pointer-events-none cursor-not-allowed"
              : "cursor-pointer",
          )}
          ref={forwardedRef}
          onSelect={() => {}}
          asChild={asChild}
          {...props}
        >
          {getSubtree({ asChild, children }, (children) => (
            <span
              className={cn(
                "text-muted-foreground relative inline-flex items-center justify-center pb-1.5 whitespace-nowrap transition-colors",
                "group-hover:text-foreground group-data-[active]:text-foreground",
                disabled && "text-muted-foreground/50 pointer-events-none",
                className,
              )}
            >
              <span
                className={cn(
                  "inline-flex h-8 items-center justify-center gap-1.5",
                )}
              >
                {showLeadingIcon && leadingIcon && (
                  <span className="flex shrink-0 items-center justify-center text-current [&_svg]:size-3.5 [&_svg]:shrink-0">
                    {leadingIcon}
                  </span>
                )}
                <span className="px-0.5 text-sm font-medium text-current">
                  {children}
                </span>
                {showBadge && badge !== undefined && badge !== null && (
                  <span className="bg-primary text-primary-foreground flex min-w-5 items-center justify-center rounded-sm px-1.5 py-0.5 text-xs font-medium">
                    {badge}
                  </span>
                )}
              </span>
            </span>
          ))}
        </NavigationMenuPrimitive.Link>
      </NavigationMenuPrimitive.Item>
    )
  },
)

TabNavigationLink.displayName = "TabNavigationLink"

export { TabNavigation, TabNavigationLink }
export type { TabNavigationLinkProps }
