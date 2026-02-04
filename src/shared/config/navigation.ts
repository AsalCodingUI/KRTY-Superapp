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
} from "@remixicon/react"

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
      name: "Message",
      href: siteConfig.baseLinks.message,
      icon: RiMessage3Line,
      roles: ["stakeholder", "employee"],
    },
    {
      name: "Attendance",
      href: siteConfig.baseLinks.attendance,
      icon: RiCalendarCheckLine,
      roles: ["stakeholder", "employee"],
    },
    {
      name: "Leave & Permission",
      href: siteConfig.baseLinks.leave,
      icon: RiUserSmileLine,
      roles: ["stakeholder", "employee"],
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
