"use client"

import { useUserProfile } from "@/hooks/useUserProfile"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { AdminReviewDashboard } from "../admin/AdminReviewDashboard"
import { EmployeeReviewView } from "./EmployeeReviewView"

export function Review360Tab() {
    const { profile, loading } = useUserProfile()
    const [isCycleActive, setIsCycleActive] = useState(false)
    const [currentCycleId, setCurrentCycleId] = useState<string | null>(null)
    const supabase = createClient()

    // Cek apakah hari ini ada siklus review yang aktif
    useEffect(() => {
        const checkCycle = async () => {
            const now = new Date().toISOString()
            const { data } = await supabase
                .from('review_cycles')
                .select('*')
                .lte('start_date', now)   // Mulai <= Sekarang
                .gte('end_date', now)     // Selesai >= Sekarang
                .eq('is_active', true)
                .single()

            if (data) {
                setIsCycleActive(true)
                setCurrentCycleId(data.id)
            }
        }
        checkCycle()
    }, [supabase])

    if (loading) return <div className="p-4 text-content-subtle">Loading access rights...</div>

    // --- POV 1: STAKEHOLDER (ADMIN) ---
    if (profile?.role === 'stakeholder') {
        return <AdminReviewDashboard activeCycleId={currentCycleId} />
    }

    // --- POV 2: EMPLOYEE ---
    return (
        <EmployeeReviewView
            profile={profile}
            isCycleActive={isCycleActive}
            currentCycleId={currentCycleId}
        />
    )
}