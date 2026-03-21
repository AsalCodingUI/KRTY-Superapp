"use client"

import { siteConfig } from "@/app/siteConfig"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TabNavigation,
  TabNavigationLink,
} from "@/shared/ui"
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
      tab.href === siteConfig.baseLinks.settings.permission &&
      profile.is_super_admin !== true
    ) {
      return false
    }
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

        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
