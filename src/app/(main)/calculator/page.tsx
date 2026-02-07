import { createClient } from "@/shared/api/supabase/server"
import { CalculatorPage } from "@/page-slices/calculator"

export const dynamic = "force-dynamic"

export default async function CalculatorRoute() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, job_title, hourly_rate")
    .eq("role", "employee")
    .order("full_name", { ascending: true })

  return <CalculatorPage teamMembers={profiles || []} />
}
