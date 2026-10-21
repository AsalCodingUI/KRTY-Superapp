"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  useSettingsModal,
  type SettingsSection,
} from "@/shared/hooks/useSettingsModal"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { isAdminRole } from "@/shared/lib/roles"
import { cx } from "@/shared/lib/utils"
import {
  RemixiconComponentType,
  RiGroupLine,
  RiTimeLine,
  RiUserLine,
} from "@/shared/ui/lucide-icons"
import { AttendanceSettings } from "./AttendanceSettings"
import GeneralSettingsPage from "./GeneralSettingsPage"
import { MembersAccessSettings } from "./MembersAccessSettings"

type Section = {
  id: SettingsSection
  name: string
  description: string
  icon: RemixiconComponentType
  superAdminOnly?: boolean
  /** Stakeholders (and super admins) only. */
  adminOnly?: boolean
  /** Renders edge to edge and manages its own scrolling. */
  fullBleed?: boolean
}

const SECTIONS: Section[] = [
  {
    id: "general",
    name: "Umum",
    description: "Informasi profil kamu.",
    icon: RiUserLine,
  },
  {
    id: "members",
    name: "Anggota & Akses",
    description: "Tambah anggota, atur peran, dan halaman yang bisa dibuka.",
    icon: RiGroupLine,
    superAdminOnly: true,
    fullBleed: true,
  },
  {
    id: "attendance",
    name: "Kehadiran",
    description: "Aturan clock in & clock out untuk semua anggota.",
    icon: RiTimeLine,
  },
]

/** Old links (?settings=team-access / permission) land on Members. */
const ALIASES: Record<string, SettingsSection> = {
  "team-access": "members",
  permission: "members",
}

export function SettingsDialog() {
  const { section, open, close } = useSettingsModal()
  const { profile } = useUserProfile()
  const isSuperAdmin = profile?.is_super_admin === true

  const isAdmin = isSuperAdmin || isAdminRole(profile?.role)
  const visible = SECTIONS.filter(
    (s) => (!s.superAdminOnly || isSuperAdmin) && (!s.adminOnly || isAdmin),
  )
  const requested = section ? (ALIASES[section] ?? section) : null
  // Unknown or not-allowed sections fall back to the first one.
  const active =
    visible.find((s) => s.id === requested) ?? visible[0] ?? SECTIONS[0]

  return (
    <Dialog
      open={section !== null}
      onOpenChange={(next) => {
        if (!next) close()
      }}
    >
      <DialogContent className="flex h-[min(680px,85vh)] w-[min(1080px,92vw)] max-w-none gap-0 overflow-hidden p-0 sm:max-w-none">
        <nav className="bg-background flex w-52 shrink-0 flex-col gap-1 border-r p-2 pt-4">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => open(item.id)}
              aria-current={item.id === active.id ? "page" : undefined}
              className={cx(
                "flex h-8 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left text-sm transition-colors [&_svg]:size-4",
                item.id === active.id
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-col gap-0.5 border-b px-6 pt-5 pr-14 pb-4">
            <DialogTitle className="text-base font-medium">
              {active.name}
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              {active.description}
            </p>
          </div>
          <div
            className={cx(
              "min-h-0 flex-1",
              active.fullBleed
                ? "overflow-hidden"
                : "overflow-y-auto px-6 py-5",
            )}
          >
            {active.id === "general" && <GeneralSettingsPage />}
            {active.id === "members" && <MembersAccessSettings />}
            {active.id === "attendance" && <AttendanceSettings />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
