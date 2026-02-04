export const siteConfig = {
  name: "Kretya Studio",
  url: "https://dashboard.tremor.so",
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
