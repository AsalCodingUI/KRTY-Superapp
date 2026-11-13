"use client"

import * as React from "react"
import { siteConfig } from "@/app/siteConfig"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { accessLevel, canRunProjects } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"
import {
  RiAddLine,
  RiCalendarCheckLine,
  RiCalendarEventLine,
  RiFolderLine,
  RiStickyNoteLine,
  type RemixiconComponentType,
} from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"

const links = siteConfig.baseLinks

type NewItem = {
  label: MessageKey<"nav">
  icon: RemixiconComponentType
  /** The page that opens its "new …" form on ?new=1 (useNewParam). */
  href: string
}

/** The panel's full-width "+ …" button (+ Baru; a workspace's own, like
 *  the wiki's + Halaman baru): an outline, centred label; collapsed to the
 *  rail, a plain + like the rows. */
export const panelNewButtonClassName = cn(
  // Line only, no fill: the bell's 1px chrome line, the chrome's hover wash.
  "border-border text-foreground hover:bg-chrome-hover aria-expanded:bg-chrome-hover dark:border-border dark:hover:bg-chrome-hover border bg-transparent dark:bg-transparent",
  "min-w-0 flex-1 justify-center group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:p-0!",
  // Collapsed: a plain icon like the rows under it, no line.
  "group-data-[collapsible=icon]:blend-ink group-data-[collapsible=icon]:text-chrome-label group-data-[collapsible=icon]:border-transparent dark:group-data-[collapsible=icon]:border-transparent",
)

/**
 * "+ Baru" at the sidebar's top: an outline button, opening
 * what you can start from anywhere. Each item opens its page's own form
 * (?new=1), so there's one form per thing, not a second copy here.
 */
export function NewMenu({
  className,
  aside,
}: {
  className?: string
  /** Beside the button (the bell); the menu fills the button and it. */
  aside?: React.ReactNode
}) {
  const rowRef = React.useRef<HTMLDivElement>(null)
  const t = useT("nav")
  const router = useRouter()
  const { profile } = useUserProfile()
  const { state } = useSidebar()
  const level = accessLevel(profile)

  const items: NewItem[] = [
    {
      // Stakeholders record a leave for someone; everyone else asks.
      label: level === "stakeholder" ? "newLeaveRecord" : "newLeave",
      icon: RiCalendarCheckLine,
      href: `${links.leave}?new=1`,
    },
    {
      label: "newEvent",
      icon: RiCalendarEventLine,
      href: `${links.calendar}/personal?new=1`,
    },
    {
      label: "newNote",
      icon: RiStickyNoteLine,
      href: `${links.projects}/my-notes?new=1`,
    },
    ...(canRunProjects(level)
      ? [
          {
            label: "newProject" as const,
            icon: RiFolderLine,
            href: `${links.projects}?new=1`,
          },
        ]
      : []),
  ]

  const collapsed = state === "collapsed"
  const trigger = (
    <DropdownMenuTrigger
      aria-label={t("newMenu")}
      // An outline button, full width, its label centred; collapsed to
      // icons, the + alone.
      render={
        <Button
          variant="outline"
          className={panelNewButtonClassName}
        />
      }
    >
      <RiAddLine
        data-icon="inline-start"
        // Collapsed: the rows' 14px icons.
        className="size-4 group-data-[collapsible=icon]:size-3.5"
      />
      <span className="group-data-[collapsible=icon]:sr-only">
        {t("newMenu")}
      </span>
    </DropdownMenuTrigger>
  )

  return (
    <div
      ref={rowRef}
      className={cn(
        "flex items-center gap-2 group-data-[collapsible=icon]:flex-col",
        className,
      )}
    >
      <DropdownMenu>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger render={trigger} />
            <TooltipContent side="right">{t("newMenu")}</TooltipContent>
          </Tooltip>
        ) : (
          trigger
        )}
        <DropdownMenuContent
          align="start"
          side={collapsed ? "right" : "bottom"}
          sideOffset={4}
          // Fills the row (the button and the bell), not just the button.
          anchor={collapsed ? undefined : rowRef}
          // Collapsed, the anchor is the 32px button: the menu's own width.
          className={collapsed ? undefined : "w-(--anchor-width) max-w-none"}
        >
          {items.map((item) => (
            <DropdownMenuItem
              key={item.label}
              onClick={() => router.push(item.href)}
            >
              <item.icon />
              {t(item.label)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {aside}
    </div>
  )
}
