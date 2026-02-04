import { createClient } from "@/shared/api/supabase/server"
import { CalculatorPage } from "@/page-slices/calculator"

export const dynamic = "force-dynamic"

export default async function CalculatorRoute() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "employee")
    .order("full_name", { ascending: true })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-content dark:text-content text-lg font-semibold sm:text-xl">
          Project Calculator
        </h1>
      </div>

      <CalculatorPage teamMembers={profiles || []} />
    </div>
  )
}
