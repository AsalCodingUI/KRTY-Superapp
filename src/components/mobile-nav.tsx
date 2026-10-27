"use client"

import { siteConfig } from "@/app/siteConfig"
import { LanguageSwitcher } from "@/components/language-switcher"
import { PrefetchLink } from "@/components/prefetch-link"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import {
  RiCalendarCheckLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiHome2Line,
  RiMoreFill,
} from "@/shared/ui/lucide-icons"
import { usePathname } from "next/navigation"
import { useState } from "react"

const links = siteConfig.baseLinks

/**
 * Phones get the essentials only, from a tab bar at the bottom: today
 * (attendance), my tasks, my calendar, leave, and "More" (theme, language,
 * sign out; notifications stay on the bell up top). The rest of the app is
 * for bigger screens; its pages still open from links (notifications…).
 */
const TABS = [
  { key: "home", href: links.dashboard, icon: RiHome2Line, label: "home" },
  {
    key: "tasks",
    href: `${links.projects}/my-tasks`,
    icon: RiCheckboxCircleLine,
    label: "mobileTasks",
  },
  {
    key: "calendar",
    href: `${links.calendar}/personal`,
    icon: RiCalendarLine,
    label: "calendar",
  },
  {
    key: "leave",
    href: links.leave,
    icon: RiCalendarCheckLine,
    label: "mobileLeave",
  },
] as const

export function MobileNav() {
  const t = useT("nav")
  const tc = useT("common")
  const pathname = usePathname()
  const { profile, userEmail } = useUserProfile()
  const [more, setMore] = useState(false)

  const signOut = async () => {
    await createClient().auth.signOut()
    window.location.href = "/login"
  }

  return (
    <>
      <nav
        aria-label={t("mobileNav")}
        className="bg-background/90 border-border fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto flex max-w-md">
          {TABS.map(({ key, href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <li key={key} className="flex-1">
                <PrefetchLink
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {t(label)}
                </PrefetchLink>
              </li>
            )
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMore(true)}
              className="text-muted-foreground flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
            >
              <RiMoreFill className="size-5" />
              {t("more")}
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent
          side="bottom"
          className="gap-0 rounded-t-3xl pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="flex-row items-center gap-3 px-5 pt-5 pb-4">
            <Avatar className="size-9">
              <AvatarFallback className="text-xs">
                {(profile?.full_name ?? "?")
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-sm font-medium">
                {profile?.full_name ?? tc("loading")}
              </SheetTitle>
              <p className="text-muted-foreground truncate text-xs">
                {profile?.email || userEmail}
              </p>
            </div>
          </SheetHeader>
          <div className="border-border flex flex-col gap-4 border-t px-5 py-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span>{t("theme")}</span>
              <ThemeSwitcher />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>{t("language")}</span>
              <LanguageSwitcher />
            </div>
          </div>
          <div className="border-border border-t px-5 py-4">
            <Button variant="destructive" className="w-full" onClick={signOut}>
              {tc("logOut")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
