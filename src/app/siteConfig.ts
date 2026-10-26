export const siteConfig = {
  name: "Kretya Studio",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://app.kretya.studio",
  description: "Internal tools for Kretya Team.",
  baseLinks: {
    home: "/",
    dashboard: "/dashboard",
    leave: "/leave",
    performance: "/performance",
    policies: "/policies",
    contracts: "/contracts",
    finance: "/finance",
    projects: "/projects",
    clients: "/clients",
    processes: "/processes",
    paymentMethods: "/payment-methods",
    teams: "/teams",
    calendar: "/calendar",
    settings: {
      general: "/settings/general",
      permission: "/settings/permission",
      teamAccess: "/settings/team-access",
    },
  },
}

export type siteConfig = typeof siteConfig
