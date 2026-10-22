"use client"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { MembersAccessSettings } from "@/page-slices/settings/ui"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { RiLockLine } from "@/shared/ui/lucide-icons"

/** Super admins only; RLS guards the data, this guards the page. */
export function MembersAccessPage() {
  const { profile, loading } = useUserProfile()
  const isSuperAdmin = profile?.is_super_admin === true

  return (
    <div className="flex flex-col">
      <PageHeader className="pt-6 pb-4" title="Anggota & Akses" />
      {loading ? null : isSuperAdmin ? (
        <div className="pb-4">
          <MembersAccessSettings />
        </div>
      ) : (
        <EmptyState
          title="Tidak punya akses"
          description="Halaman ini hanya untuk super admin."
          icon={<RiLockLine className="size-5" />}
          placement="inner"
        />
      )}
    </div>
  )
}
