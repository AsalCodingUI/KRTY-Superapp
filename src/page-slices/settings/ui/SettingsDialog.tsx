"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/shared/api/supabase/client"
import {
  useSettingsModal,
  type SettingsSection,
} from "@/shared/hooks/useSettingsModal"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { cx } from "@/shared/lib/utils"
import {
  RemixiconComponentType,
  RiGroupLine,
  RiLockLine,
  RiUserLine,
} from "@/shared/ui/lucide-icons"
import { useQuery } from "@tanstack/react-query"
import type { ComponentProps } from "react"
import GeneralSettingsPage from "./GeneralSettingsPage"
import PermissionSettingsPage from "./PermissionSettingsPage"
import TeamAccessSettingsPage from "./TeamAccessSettingsPage"

type Section = {
  id: SettingsSection
  name: string
  description: string
  icon: RemixiconComponentType
  group: "Akun" | "Admin"
  superAdminOnly?: boolean
}

const SECTIONS: Section[] = [
  {
    id: "general",
    name: "Umum",
    description: "Informasi profil kamu.",
    icon: RiUserLine,
    group: "Akun",
  },
  {
    id: "team-access",
    name: "Team Access",
    description: "Tambah anggota, atur tim, dan masuk sebagai anggota lain.",
    icon: RiGroupLine,
    group: "Admin",
    superAdminOnly: true,
  },
  {
    id: "permission",
    name: "Permissions",
    description: "Role, job title, dan akses halaman tiap anggota.",
    icon: RiLockLine,
    group: "Admin",
    superAdminOnly: true,
  },
]

const PROFILE_COLUMNS =
  "id, full_name, email, role, job_title, is_super_admin, avatar_url, hourly_rate, krt_id, leave_balance, leave_used, manager_id, team_id, created_at, updated_at"

type TeamAccessProps = ComponentProps<typeof TeamAccessSettingsPage>
type PermissionProps = ComponentProps<typeof PermissionSettingsPage>

/** Same queries the old server routes ran; RLS applies to the user. */
function TeamAccessSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["settings", "team-access"],
    queryFn: async () => {
      const supabase = createClient()
      const [profiles, teams] = await Promise.all([
        supabase.from("profiles").select(PROFILE_COLUMNS).order("full_name"),
        supabase
          .from("teams")
          .select("id, name, code, created_at")
          .order("name"),
      ])
      if (profiles.error) throw profiles.error
      if (teams.error) throw teams.error
      return {
        initialProfiles: profiles.data,
        teams: teams.data,
      } as unknown as TeamAccessProps
    },
  })
  if (error) return <SectionError />
  if (isLoading || !data) return <SectionSkeleton />
  return <TeamAccessSettingsPage {...data} />
}

function PermissionSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["settings", "permission"],
    queryFn: async () => {
      const supabase = createClient()
      const [profiles, permissions] = await Promise.all([
        supabase.from("profiles").select(PROFILE_COLUMNS).order("full_name"),
        supabase
          .from("user_page_permissions")
          .select("id, user_id, page_slug, granted, granted_by, created_at"),
      ])
      if (profiles.error) throw profiles.error
      return {
        initialData: profiles.data,
        initialPermissions: permissions.data ?? [],
      } as unknown as PermissionProps
    },
  })
  if (error) return <SectionError />
  if (isLoading || !data) return <SectionSkeleton />
  return <PermissionSettingsPage {...data} />
}

function SectionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="ml-auto h-3.5 w-24" />
        </div>
      ))}
    </div>
  )
}

function SectionError() {
  return (
    <p className="text-destructive text-sm">Gagal memuat data pengaturan.</p>
  )
}

export function SettingsDialog() {
  const { section, open, close } = useSettingsModal()
  const { profile } = useUserProfile()
  const isSuperAdmin = profile?.is_super_admin === true

  const visible = SECTIONS.filter((s) => !s.superAdminOnly || isSuperAdmin)
  // Unknown or not-allowed sections fall back to the first one.
  const active =
    visible.find((s) => s.id === section) ?? visible[0] ?? SECTIONS[0]
  const groups = ["Akun", "Admin"] as const

  return (
    <Dialog
      open={section !== null}
      onOpenChange={(next) => {
        if (!next) close()
      }}
    >
      <DialogContent className="flex h-[min(680px,85vh)] w-[min(1080px,92vw)] max-w-none gap-0 overflow-hidden p-0 sm:max-w-none">
        {/* Section nav */}
        <nav className="bg-background flex w-52 shrink-0 flex-col gap-4 border-r p-2 pt-4">
          {groups.map((group) => {
            const items = visible.filter((s) => s.group === group)
            if (items.length === 0) return null
            return (
              <div key={group} className="flex flex-col gap-px">
                <span className="text-muted-foreground px-2 pb-1 text-xs font-medium">
                  {group}
                </span>
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => open(item.id)}
                    aria-current={item.id === active.id ? "page" : undefined}
                    className={cx(
                      "flex h-7 cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm transition-colors [&_svg]:size-4",
                      item.id === active.id
                        ? "bg-accent text-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <item.icon />
                    {item.name}
                  </button>
                ))}
              </div>
            )
          })}
        </nav>

        {/* Section content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-col gap-0.5 border-b px-6 pt-5 pr-14 pb-4">
            <DialogTitle className="text-base font-medium">
              {active.name}
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              {active.description}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {active.id === "general" && <GeneralSettingsPage />}
            {active.id === "team-access" && <TeamAccessSection />}
            {active.id === "permission" && <PermissionSection />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
