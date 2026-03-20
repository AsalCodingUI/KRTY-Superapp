import { createClient } from "@/shared/api/supabase/server"
import { CalculatorPage } from "@/page-slices/calculator"

export default async function CalculatorRoute() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, job_title, hourly_rate")
    .eq("role", "employee")
    .order("full_name", { ascending: true })

  const { data: operationalCosts } = await supabase
    .from("operational_costs")
    .select(
      "id, item_name, amount_idr, category, currency_original, amount_original, exchange_rate_assumed, is_active",
    )
    .order("item_name", { ascending: true })

  return (
    <CalculatorPage
      teamMembers={profiles || []}
      operationalCosts={operationalCosts || []}
    />
  )
}
