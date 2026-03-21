export const siteConfig = {
  name: "Kretya Studio",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://app.kretya.studio",
  description: "Internal tools for Kretya Team.",
  baseLinks: {
    home: "/",
    dashboard: "/dashboard",
    attendance: "/attendance",
    leave: "/leave",
    performance: "/performance",
    calculator: "/calculator",
    payroll: "/payroll",
    teams: "/teams",
    calendar: "/calendar",
    message: "/message",
    slaGenerator: "/sla-generator",
    settings: {
      general: "/settings/general",
      permission: "/settings/permission",
    },
  },
}

export type siteConfig = typeof siteConfig
