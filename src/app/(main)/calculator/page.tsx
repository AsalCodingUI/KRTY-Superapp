import { createClient } from "@/lib/supabase/server"
import CalculatorClientPage from "./ClientPage"

export const dynamic = 'force-dynamic'

export default async function CalculatorPage() {
    const supabase = createClient()

    // Fetch active employees only for squad allocation
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee')
        .order('full_name', { ascending: true })

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-content sm:text-xl dark:text-content">
                    Project Calculator
                </h1>
            </div>

            <CalculatorClientPage teamMembers={profiles || []} />
        </div>
    )
}