import { FinancePage } from "@/page-slices/finance"
import { createClient } from "@/shared/api/supabase/server"

export const dynamic = "force-dynamic"

export default async function FinanceRoute() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <div>Please login</div>

  return <FinancePage />
}
