import { createClient } from "@/shared/api/supabase/server"
import { PermissionSettingsPage } from "@/page-slices/settings"

export const dynamic = "force-dynamic"

export default async function PermissionRoute() {
  const supabase = await createClient()

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true })

  if (error) {
    return (
      <div className="p-4 text-red-500">Error loading permissions data.</div>
    )
  }

  return <PermissionSettingsPage initialData={profiles || []} />
}
