import { PageHeader } from "@/components/page-header"
import { createClient } from "@/shared/api/supabase/server"
import { CalculatorPage } from "@/page-slices/calculator"

export const dynamic = "force-dynamic"

export default async function CalculatorRoute() {
  const supabase = await createClient()

  const [{ data: profiles }, { data: operationalCosts }, { data: projects }] =
    await Promise.all([
      supabase.rpc("get_team_compensation"),
      supabase
        .from("operational_costs")
        .select(
          "id, item_name, amount_idr, category, currency_original, amount_original, exchange_rate_assumed, is_active",
        )
        .order("item_name", { ascending: true }),
      supabase
        .from("projects")
        .select("id, name")
        .neq("status", "Archived")
        .order("name", { ascending: true }),
    ])

  return (
    <div className="flex flex-col">
      <PageHeader className="pt-6 pb-4" title="Calculator" />
      <div className="pb-4">
        <CalculatorPage
          teamMembers={(profiles || []).filter(
            (p: { role: string }) => p.role === "employee",
          )}
          operationalCosts={operationalCosts || []}
          projects={(projects || []).map((p: { id: string; name: string }) => ({
            id: p.id,
            name: p.name,
          }))}
        />
      </div>
    </div>
  )
}
