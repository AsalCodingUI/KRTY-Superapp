import { createClient } from "@/lib/supabase/server"
import PerformanceClientPage from "./ClientPage"

export default async function PerformancePage() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Please login</div>

    return <PerformanceClientPage />
}