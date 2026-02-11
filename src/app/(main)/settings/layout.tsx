"use client"

import { siteConfig } from "@/app/siteConfig"
import { TabNavigation, TabNavigationLink } from "@/shared/ui"
import { useUserProfile } from "@/shared/hooks/useUserProfile" // Import hook buat cek role
import { hasRoleAccess } from "@/shared/lib/roles"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { RiSettings5Line } from "@/shared/ui/lucide-icons"

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
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
        <RiSettings5Line className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">Settings</p>
      </div>

      <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
        <div className="border-b border-neutral-primary px-5 pt-2">
          <TabNavigation className="border-b-0">
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
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
