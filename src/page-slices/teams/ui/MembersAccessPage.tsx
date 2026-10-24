"use client"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { MembersAccessSettings } from "@/page-slices/settings/ui"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { RiLockLine } from "@/shared/ui/lucide-icons"

/** Super admins only; RLS guards the data, this guards the page. */
export function MembersAccessPage() {
  const t = useT("teams")
  const { profile, loading } = useUserProfile()
  const isSuperAdmin = profile?.is_super_admin === true

  return (
    <div className="flex flex-col">
      {loading ? (
        <PageHeader className="pt-6 pb-4" title={t("membersAccess")} />
      ) : isSuperAdmin ? (
        <div className="pb-4">
          <MembersAccessSettings title={t("membersAccess")} />
        </div>
      ) : (
        <>
          <PageHeader className="pt-6 pb-4" title={t("membersAccess")} />
          <EmptyState
            title={t("noAccessTitle")}
            description={t("noAccessDesc")}
            icon={<RiLockLine className="size-5" />}
            placement="inner"
          />
        </>
      )}
    </div>
  )
}
