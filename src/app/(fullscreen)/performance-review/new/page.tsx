import { createClient } from "@/shared/api/supabase/server"
import { dedupeProfilesByEmail } from "@/shared/lib/profile-dedupe"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { redirect } from "next/navigation"
import ReviewFormClientPage from "./ClientPage"

export const dynamic = "force-dynamic"

export default async function NewReviewPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const actorProfile = await resolveProfileByUserIdOrEmail<{
    id: string
    email: string | null
    created_at: string | null
  }>(
    supabase,
    "id, email, created_at",
    user.id,
    user.email,
  )

  const now = new Date().toISOString()
  const { data: activeCycle } = await supabase
    .from("review_cycles")
    .select("id, start_date, end_date, is_active")
    .lte("start_date", now)
    .gte("end_date", now)
    .eq("is_active", true)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!activeCycle) {
    redirect("/performance?error=cycle_closed")
  }

  const { data: colleagues } = await supabase
    .from("profiles")
    .select("id, email, full_name, job_title, role, created_at")
    .neq("role", "stakeholder")
    .order("full_name", { ascending: true })

  const colleagueOptions = Array.from(
    new Map(
      dedupeProfilesByEmail(colleagues || [])
        .filter((colleague) => colleague.id !== actorProfile?.id)
        .map((colleague) => {
          const key = colleague.email?.trim().toLowerCase()
            || `${(colleague.full_name || "").trim().toLowerCase()}::${(colleague.job_title || "").trim().toLowerCase()}`

          return [
            key,
            {
              id: colleague.id,
              full_name: colleague.full_name ?? null,
              job_title: colleague.job_title ?? null,
            },
          ] as const
        }),
    ).values(),
  )

  return (
    <ReviewFormClientPage
      cycleId={activeCycle.id}
      colleagues={colleagueOptions}
    />
  )
}
