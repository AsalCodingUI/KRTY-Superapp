import { createClient } from "@/lib/supabase/server"
import PermissionClientPage from "./ClientPage"

export const dynamic = 'force-dynamic' // Pastikan data selalu fresh

export default async function PermissionPage() {
    const supabase = createClient()

    // Fetch data profiles
    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true })

    if (error) {
        return <div className="p-4 text-red-500">Error loading permissions data.</div>
    }

    return (
        <PermissionClientPage initialData={profiles || []} />
    )
}