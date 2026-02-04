import { PerformancePage } from "@/page-slices/performance"
import { createClient } from "@/shared/api/supabase/server"

export default async function PerformanceRoute() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <div>Please login</div>

  return <PerformancePage />
}
