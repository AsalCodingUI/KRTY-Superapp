import { createClient } from "@/shared/api/supabase/server"
import { redirect } from "next/navigation"
import ReviewFormClientPage from "./ClientPage"

export const dynamic = "force-dynamic"

export default async function NewReviewPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const now = new Date().toISOString()
  const { data: activeCycle } = await supabase
    .from("review_cycles")
    .select("id, start_date, end_date, is_active")
    .lte("start_date", now)
    .gte("end_date", now)
    .eq("is_active", true)
    .single()

  if (!activeCycle) {
    redirect("/performance?error=cycle_closed")
  }

  const { data: colleagues } = await supabase
    .from("profiles")
    .select("id, full_name, job_title")
    .neq("id", user.id)
    .neq("role", "stakeholder")
    .order("full_name", { ascending: true })

  return (
    <ReviewFormClientPage
      cycleId={activeCycle.id}
      colleagues={colleagues || []}
    />
  )
}
