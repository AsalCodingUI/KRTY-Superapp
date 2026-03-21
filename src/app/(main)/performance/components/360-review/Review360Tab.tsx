"use client"

import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { createClient } from "@/shared/api/supabase/client"
import { canManageByRole } from "@/shared/lib/roles"
import { Spinner, type QuarterFilterValue } from "@/shared/ui"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { AdminReviewDashboard } from "../admin/AdminReviewDashboard"
import { EmployeeReviewView } from "./EmployeeReviewView"

function getCurrentQuarterValue(): QuarterFilterValue {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  let quarter = "Q1"
  if (month >= 4 && month <= 6) quarter = "Q2"
  else if (month >= 7 && month <= 9) quarter = "Q3"
  else if (month >= 10) quarter = "Q4"
  return `${year}-${quarter}`
}

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
  const { data: currentCycleId } = useQuery({
    queryKey: ["review-active-cycle"],
    queryFn: async () => {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from("review_cycles")
        .select("id")
        .lte("start_date", now) // Mulai <= Sekarang
        .gte("end_date", now) // Selesai >= Sekarang
        .eq("is_active", true)
        .single()

      return data?.id ?? null
    },
  })

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    )

  // --- POV 1: STAKEHOLDER (ADMIN) ---
  if (canManageByRole(profile?.role)) {
    return (
      <AdminReviewDashboard
        selectedQuarter={
          (selectedQuarter as QuarterFilterValue) ?? getCurrentQuarterValue()
        }
      />
    )
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
