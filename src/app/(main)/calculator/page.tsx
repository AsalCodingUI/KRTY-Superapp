import { createClient } from "@/shared/api/supabase/server"
import { CalculatorPage } from "@/page-slices/calculator"

export const dynamic = "force-dynamic"

export default async function CalculatorRoute() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, job_title, hourly_rate, monthly_salary")
    .eq("role", "employee")
    .order("full_name", { ascending: true })

  const { data: operationalCosts } = await supabase
    .from("operational_costs")
    .select(
      "id, item_name, amount_idr, category, currency_original, amount_original, exchange_rate_assumed, is_active",
    )
    .order("item_name", { ascending: true })

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .neq("status", "Archived")
    .order("name", { ascending: true })

  return (
    <CalculatorPage
      teamMembers={profiles || []}
      operationalCosts={operationalCosts || []}
      projects={(projects || []).map((p: { id: string; name: string }) => ({
        id: p.id,
        name: p.name,
      }))}
    />
  )
}
