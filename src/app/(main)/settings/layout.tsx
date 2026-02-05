"use client"

import { siteConfig } from "@/app/siteConfig"
import { TabNavigation, TabNavigationLink } from "@/shared/ui"
import { useUserProfile } from "@/shared/hooks/useUserProfile" // Import hook buat cek role
import { hasRoleAccess } from "@/shared/lib/roles"
import Link from "next/link"
import { usePathname } from "next/navigation"

// Definisi Tab dengan Role Access
const settingsTabs = [
  {
    name: "General",
    href: siteConfig.baseLinks.settings.general,
    roles: ["stakeholder", "employee"], // Semua bisa akses
  },
  {
    name: "Permission",
    href: siteConfig.baseLinks.settings.permission,
    roles: ["stakeholder"], // Cuma Admin/Stakeholder
  },
]

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const { profile, loading } = useUserProfile()

  // Filter tab berdasarkan role user yang login
  const visibleTabs = settingsTabs.filter((tab) => {
    if (loading || !profile) return false
    return hasRoleAccess(tab.roles, profile.role)
  })

  return (
    <>
      <h1 className="text-heading-md text-content sm:text-heading-lg dark:text-content">
        Settings
      </h1>

      <TabNavigation className="mt-4 sm:mt-6 lg:mt-6">
        {!loading &&
          visibleTabs.map((item) => (
            <TabNavigationLink
              key={item.name}
              asChild
              active={pathname === item.href}
            >
              <Link href={item.href}>{item.name}</Link>
            </TabNavigationLink>
          ))}
      </TabNavigation>

      <div className="pt-6">{children}</div>
    </>
  )
}
