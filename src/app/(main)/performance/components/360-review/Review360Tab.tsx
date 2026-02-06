"use client"

import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { createClient } from "@/shared/api/supabase/client"
import { canManageByRole } from "@/shared/lib/roles"
import { useEffect, useState } from "react"
import { AdminReviewDashboard } from "../admin/AdminReviewDashboard"
import { EmployeeReviewView } from "./EmployeeReviewView"

export function Review360Tab(
  {
    selectedQuarter,
    onQuarterChange,
  }: {
    selectedQuarter?: string
    onQuarterChange?: (value: string) => void
  } = {},
) {
  const { profile, loading } = useUserProfile()
  const [isCycleActive, setIsCycleActive] = useState(false)
  const [currentCycleId, setCurrentCycleId] = useState<string | null>(null)
  const supabase = createClient()

  // Cek apakah hari ini ada siklus review yang aktif
  useEffect(() => {
    const checkCycle = async () => {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from("review_cycles")
        .select("*")
        .lte("start_date", now) // Mulai <= Sekarang
        .gte("end_date", now) // Selesai >= Sekarang
        .eq("is_active", true)
        .single()

      if (data) {
        setIsCycleActive(true)
        setCurrentCycleId(data.id)
      }
    }
    checkCycle()
  }, [supabase])

  if (loading)
    return (
      <div className="text-content-subtle p-4">Loading access rights...</div>
    )

  // --- POV 1: STAKEHOLDER (ADMIN) ---
  if (canManageByRole(profile?.role)) {
    return <AdminReviewDashboard activeCycleId={currentCycleId} />
  }

  // --- POV 2: EMPLOYEE ---
  return (
    <EmployeeReviewView
      profile={profile}
      isCycleActive={isCycleActive}
      currentCycleId={currentCycleId}
      selectedQuarter={selectedQuarter}
      onQuarterChange={onQuarterChange}
      showQuarterFilter={false}
    />
  )
}
