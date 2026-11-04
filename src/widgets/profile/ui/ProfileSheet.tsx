"use client"

import { EmptyValue } from "@/components/empty-value"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { annualLeaveSummary } from "@/shared/lib/leave"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AvatarEditor } from "./AvatarEditor"

type MyProfile = {
  id: string
  full_name: string | null
  email: string | null
  job_title: string | null
  avatar_url: string | null
  join_date: string | null
  employment_type: string | null
  team: { name: string } | null
}

/** The signed-in person's profile row, team name and this year's leave. */
function useMyProfile(profileId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["profile", "me", profileId],
    enabled: enabled && Boolean(profileId),
    queryFn: async () => {
      const supabase = createClient()
      const year = new Date().getFullYear()
      const [profile, leave] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, email, job_title, avatar_url, join_date, employment_type, team:teams!profiles_team_id_fkey ( name )",
          )
          .eq("id", profileId!)
          .single(),
        supabase
          .from("leave_requests")
          .select("start_date, end_date")
          .eq("user_id", profileId!)
          .eq("status", "approved")
          .eq("leave_type", "Annual Leave")
          .lte("start_date", `${year}-12-31`)
          .gte("end_date", `${year}-01-01`),
      ])
      if (profile.error) throw profile.error
      const row = profile.data as unknown as MyProfile
      return {
        profile: row,
        leave: annualLeaveSummary(leave.data ?? [], year, row),
      }
    },
  })
}

/** Label on the left, value on the right (read-only). */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-6 border-b py-2 last:border-b-0">
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <span className="min-w-0 truncate text-right text-sm">
        {value ?? <EmptyValue />}
      </span>
    </div>
  )
}

/**
 * "Profil saya", opened from the account menu: everyone changes their own
 * picture here and reads their details. Other fields stay with admins
 * (Team page); the database refuses them from here anyway.
 */
export function ProfileSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("profile")
  const tl = useT("leave")
  const queryClient = useQueryClient()
  const { profile: session } = useUserProfile()
  const { data, isLoading, error } = useMyProfile(session?.id, open)
  const me = data?.profile

  const leave = data?.leave
  const leaveValue = !leave
    ? null
    : leave.eligible
      ? t("annualLeaveValue", {
          remaining: leave.remaining,
          quota: leave.quota,
        })
      : t("annualLeaveNone")
  const leaveNote =
    leave?.noteKey && tl(leave.noteKey, leave.noteVars ?? undefined)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("myProfile")}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("myProfileHint")}
          </SheetDescription>
        </SheetHeader>
        <div className="scroll-pane pane-px-5 flex min-h-0 flex-1 flex-col gap-8 pt-5 pb-6">
          {error ? (
            <p className="text-destructive-ink text-sm">{t("loadFailed")}</p>
          ) : isLoading || !me ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Skeleton className="size-20 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3.5 w-52" />
                  <Skeleton className="h-7 w-28" />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <AvatarEditor
                profileId={me.id}
                name={me.full_name || me.email || "?"}
                avatarUrl={me.avatar_url}
                onChanged={(url) =>
                  queryClient.setQueryData(
                    ["profile", "me", me.id],
                    data && {
                      ...data,
                      profile: { ...data.profile, avatar_url: url },
                    },
                  )
                }
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {me.full_name || me.email}
                  </p>
                  <p className="text-muted-foreground truncate text-sm">
                    {me.job_title}
                  </p>
                </div>
              </AvatarEditor>

              <section className="flex flex-col">
                <h3 className="text-muted-foreground mb-1 text-xs font-medium">
                  {t("details")}
                </h3>
                {/* Only what helps day to day: name and job title are in the
                    header above; ids, role and contract stay with admins. */}
                <Row label={t("email")} value={me.email} />
                <Row label={t("team")} value={me.team?.name ?? t("noTeam")} />
                <Row
                  label={t("annualLeave")}
                  value={
                    <span className="flex flex-col items-end">
                      <span className="tabular-nums">{leaveValue}</span>
                      {leaveNote && (
                        <span className="text-tertiary-foreground text-xs">
                          {leaveNote}
                        </span>
                      )}
                    </span>
                  }
                />
              </section>

              <p className="text-muted-foreground text-xs">
                {t("readOnlyNote")}
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
