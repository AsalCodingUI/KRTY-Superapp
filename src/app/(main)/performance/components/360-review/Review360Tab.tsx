"use client"

import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { createClient } from "@/shared/api/supabase/client"
import { canManageByRole } from "@/shared/lib/roles"
import { useMemo } from "react"
import useSWR from "swr"
import { AdminReviewDashboard } from "../admin/AdminReviewDashboard"
import { EmployeeReviewView } from "./EmployeeReviewView"

export function Review360Tab(
  {
    selectedQuarter,
    onQuarterChange,
  }: {
    selectedQuarter?: string
    onQuarterChange?: (value: string) => void
  },
) {
  const { profile, loading } = useUserProfile()
  const supabase = useMemo(() => createClient(), [])
  const { data: currentCycleId } = useSWR(
    "review-active-cycle",
    async () => {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from("review_cycles")
        .select("*")
        .lte("start_date", now) // Mulai <= Sekarang
        .gte("end_date", now) // Selesai >= Sekarang
        .eq("is_active", true)
        .single()

      return data?.id ?? null
    },
    { revalidateOnFocus: false },
  )

  if (loading)
    return (
      <div className="text-foreground-secondary p-4">Loading access rights...</div>
    )

  // --- POV 1: STAKEHOLDER (ADMIN) ---
  if (canManageByRole(profile?.role)) {
    return <AdminReviewDashboard />
  }

  // --- POV 2: EMPLOYEE ---
  return (
    <EmployeeReviewView
      profile={profile}
      currentCycleId={currentCycleId ?? null}
      selectedQuarter={selectedQuarter}
      onQuarterChange={onQuarterChange}
      showQuarterFilter={false}
    />
  )
}
