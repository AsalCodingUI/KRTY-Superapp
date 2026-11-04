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
 *   <TabNavigationLink href="#" count={3}>Settings</TabNavigationLink>
 * </TabNavigation>
 * ```
 */
const TabNavigation = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Root>,
  Omit<
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>,
    "orientation" | "defaultValue" | "dir"
  > & {
    /** No line under the tabs (tabs inside a toolbar). */
    plain?: boolean
    /** The line runs edge to edge of the page (`bleed gutter-x`). */
    bleed?: boolean
  }
>(({ className, children, plain, bleed, ...props }, forwardedRef) => {
  const nav = (
    <div className="-mb-px overflow-x-auto pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <NavigationMenuPrimitive.Root
        ref={forwardedRef}
        data-slot="tab-navigation"
        {...props}
        asChild={false}
      >
        <NavigationMenuPrimitive.List
          className={cn(
            "border-border relative flex items-start justify-start gap-6 whitespace-nowrap",
            !plain && !bleed && "border-b",
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
  if (!bleed) return nav
  return <div className="bleed gutter-x border-border border-b">{nav}</div>
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
  /** A count after the label (quiet, tabular); hidden at 0. */
  count?: number
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
      count,
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
            "group focus-visible:ring-focus-ring relative flex shrink-0 items-center justify-center rounded-md outline-none select-none focus-visible:ring-2",
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
                "text-muted-foreground relative inline-flex items-center justify-center py-1.5 whitespace-nowrap transition-colors",
                "group-hover:text-foreground group-data-[active]:text-foreground",
                disabled && "text-tertiary-foreground pointer-events-none",
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
                  {!!count && (
                    <span className="text-tertiary-foreground ml-1.5 tabular-nums">
                      {count}
                    </span>
                  )}
                </span>
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
