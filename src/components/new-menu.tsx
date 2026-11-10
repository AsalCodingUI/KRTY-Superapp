"use client"

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

/**
 * "+ Baru" at the sidebar's top: the primary button, opening
 * what you can start from anywhere. Each item opens its page's own form
 * (?new=1), so there's one form per thing, not a second copy here.
 */
export function NewMenu({ className }: { className?: string }) {
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
      // The primary button, full width, its label centred; collapsed to
      // icons, the + alone.
      render={
        <Button
          className={cn(
            "w-full justify-center group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0",
            className,
          )}
        />
      }
    >
      <RiAddLine data-icon="inline-start" />
      <span className="group-data-[collapsible=icon]:sr-only">
        {t("newMenu")}
      </span>
    </DropdownMenuTrigger>
  )

  return (
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
        className="min-w-(--anchor-width)"
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
  )
}
