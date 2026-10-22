import { siteConfig } from "@/app/siteConfig"
import {
  RemixiconComponentType,
  RiBarChartBoxLine,
  RiCalendarCheckLine,
  RiCalendarLine,
  RiFolderLine,
  RiGroupLine,
  RiHome2Line,
} from "@/shared/ui/lucide-icons"

interface NavigationItem {
  name: string
  href: string
  icon: RemixiconComponentType
  roles: readonly string[]
}

interface NavigationConfig {
  main: readonly NavigationItem[]
  footer: readonly NavigationItem[]
  shortcuts: readonly NavigationItem[]
}

export const navigationConfig: NavigationConfig = {
  // No settings page any more (theme is in the sidebar).
  footer: [],
  main: [
    {
      name: "Dashboard",
      href: siteConfig.baseLinks.dashboard,
      icon: RiHome2Line,
      roles: ["stakeholder", "employee"],
    },
    {
      name: "Calendar",
      href: siteConfig.baseLinks.calendar,
      icon: RiCalendarLine,
      roles: ["stakeholder", "employee"],
    },
    {
      name: "Leave & Attendance",
      href: siteConfig.baseLinks.leave,
      icon: RiCalendarCheckLine,
      roles: ["stakeholder", "employee"],
    },
    {
      name: "Performance",
      href: siteConfig.baseLinks.performance,
      icon: RiBarChartBoxLine,
      roles: ["stakeholder", "employee"],
    },
    {
      name: "Projects",
      href: siteConfig.baseLinks.projects,
      icon: RiFolderLine,
      roles: ["stakeholder"],
    },
    {
      name: "Teams",
      href: siteConfig.baseLinks.teams,
      icon: RiGroupLine,
      roles: ["stakeholder"],
    },
  ],
  shortcuts: [],
}
