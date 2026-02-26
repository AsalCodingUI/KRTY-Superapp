import { siteConfig } from "@/app/siteConfig"
import {
  RemixiconComponentType,
  RiBarChartBoxLine,
  RiCalculatorLine,
  RiCalendarCheckLine,
  RiCalendarLine,
  RiFileList3Line,
  RiFundsBoxLine,
  RiGroupLine,
  RiHome2Line,
  RiMessage3Line,
  RiQuestionLine,
  RiSettings5Line,
  RiUserSmileLine,
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
  footer: [
    {
      name: "Help & support",
      href: "#", // Placeholder
      icon: RiQuestionLine,
      roles: ["stakeholder", "employee"],
    },
    {
      name: "Settings",
      href: siteConfig.baseLinks.settings.general,
      icon: RiSettings5Line,
      roles: ["stakeholder", "employee"],
    },
  ],
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
      roles: ["stakeholder"],
    },
    {
      name: "Leave & Permission",
      href: siteConfig.baseLinks.leave,
      icon: RiUserSmileLine,
      roles: ["employee"],
    },
    {
      name: "Performance",
      href: siteConfig.baseLinks.performance,
      icon: RiBarChartBoxLine,
      roles: ["stakeholder", "employee"],
    },
    {
      name: "Project Calculator",
      href: siteConfig.baseLinks.calculator,
      icon: RiCalculatorLine,
      roles: ["stakeholder", "employee"],
    },
    {
      name: "SLA Generator",
      href: siteConfig.baseLinks.slaGenerator,
      icon: RiFileList3Line,
      roles: ["stakeholder", "employee"],
    },
    {
      name: "Payroll",
      href: siteConfig.baseLinks.payroll,
      icon: RiFundsBoxLine,
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
