"use client"

import { siteConfig } from "@/app/siteConfig"
import { FloatingTabBar } from "@/components/floating-tab-bar"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import {
  RiCalendarCheckLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiHome2Line,
  RiLogoutBoxLine,
} from "@/shared/ui/lucide-icons"
import {
  CalendarCheckFilled,
  CalendarEventFilled,
  CheckCircleFilled,
} from "@/widgets/notifications/ui/notification-icons"
import { usePathname } from "next/navigation"

const links = siteConfig.baseLinks

/** Lucide's house, filled (24px grid, the door cut out). */
function HomeFilled({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M10.7 2.55a2 2 0 0 1 2.6 0l7 5.95A2 2 0 0 1 21 10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10a2 2 0 0 1 .7-1.5ZM10 15v5h4v-5Z"
      />
    </svg>
  )
}

/**
 * Phones get the essentials only, from the same floating tab bar as the
 * client portal: today (attendance), my tasks, my calendar and leave; the
 * round button has theme, language and sign out (notifications stay on
 * the bell up top). The rest of the app is for bigger screens; its pages
 * still open from links (notifications…).
 */
const TABS = [
  {
    href: links.dashboard,
    icon: RiHome2Line,
    filled: HomeFilled,
    label: "home",
  },
  {
    href: `${links.projects}/my-tasks`,
    icon: RiCheckboxCircleLine,
    filled: CheckCircleFilled,
    label: "mobileTasks",
  },
  {
    href: `${links.calendar}/personal`,
    icon: RiCalendarLine,
    filled: CalendarEventFilled,
    label: "calendar",
  },
  {
    href: links.leave,
    icon: RiCalendarCheckLine,
    filled: CalendarCheckFilled,
    label: "mobileLeave",
  },
] as const

export function MobileNav() {
  const t = useT("nav")
  const tc = useT("common")
  const pathname = usePathname()
  const { profile, userEmail } = useUserProfile()

  const signOut = async () => {
    await createClient().auth.signOut()
    window.location.href = "/login"
  }

  return (
    <FloatingTabBar
      id="app-tabs"
      items={TABS.map(({ href, icon, filled, label }) => ({
        href,
        icon,
        filled,
        label: t(label),
        active: pathname === href || pathname.startsWith(`${href}/`),
      }))}
      menu={
        <>
          <div className="min-w-0 px-1 text-sm">
            <p className="truncate font-medium">
              {profile?.full_name ?? tc("loading")}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {profile?.email || userEmail}
            </p>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{tc("theme")}</span>
            <ThemeSwitcher />
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{tc("language")}</span>
            <LanguageSwitcher />
          </div>
          <Separator />
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive justify-start"
            onClick={signOut}
          >
            <RiLogoutBoxLine data-icon="inline-start" />
            {tc("logOut")}
          </Button>
        </>
      }
    />
  )
}
