"use client"

import { siteConfig } from "@/app/siteConfig"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUserProfile } from "@/shared/hooks/useUserProfile" // Import hook buat cek role
import { hasRoleAccess } from "@/shared/lib/roles"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  {
    name: "Team Access",
    href: siteConfig.baseLinks.settings.teamAccess,
    roles: ["stakeholder"],
  },
]

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, loading } = useUserProfile()

  // Filter tab berdasarkan role user yang login
  const visibleTabs = settingsTabs.filter((tab) => {
    if (loading || !profile) return false
    if (
      [
        siteConfig.baseLinks.settings.permission,
        siteConfig.baseLinks.settings.teamAccess,
      ].includes(tab.href) &&
      profile.is_super_admin !== true
    ) {
      return false
    }
    return hasRoleAccess(tab.roles, profile.role)
  })

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-xxl px-4 pt-4 pb-3 xl:px-5">
        <RiSettings5Line className="size-4 text-muted-foreground" />
        <p className="text-label-md text-foreground">Settings</p>
      </div>

      <div className="flex flex-col rounded-xxl">
        <div className="border-b border-border px-4 pt-2 xl:px-5">
          <div className="xl:hidden pb-2">
            <Select
              value={pathname}
              onValueChange={(value) => {
                if (value !== pathname) router.push(value)
              }}
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {!loading &&
                  visibleTabs.map((item) => (
                    <SelectItem key={item.href} value={item.href}>
                      {item.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden xl:block">
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
        </div>

        <div className="px-4 py-5 xl:px-5">{children}</div>
      </div>
    </div>
  )
}
