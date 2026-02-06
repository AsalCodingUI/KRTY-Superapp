"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  RadarChart,
} from "@/shared/ui"

import { Badge } from "@/shared/ui"
import { Card } from "@/shared/ui"
import { EmptyState } from "@/shared/ui"
import { QuarterFilter, type QuarterFilterValue } from "@/shared/ui"
import {
  calculateSkillPercentage,
  getRatingBadgeVariant,
  getRatingLevel,
  getSkillRating,
} from "@/entities/performance/lib/performanceUtils"
import { createClient } from "@/shared/api/supabase/client"
import { useEffect, useState } from "react"
import { ReviewStatsHeader } from "./ReviewStatsHeader"
import type { ProfileSubset } from "@/shared/hooks/useUserProfile"

// --- TIPE DATA ---
type AnalysisResult = {
  summary: {
    additional: string
    strength: string
    growth: string
    stop: string
  }
  radar: { skill: string; Self: number; Peers: number }[]
}

type SummaryRow = {
  id: string
  reviewee_id: string
  cycle_id: string
  overall_score: string | number
  overall_percentage: number
  score_quality: string | number
  score_reliability: string | number
  score_communication: string | number
  score_initiative: string | number
  score_leadership: string | number
  additional_feedback: string
  feedback_continue: string
  feedback_start: string
  feedback_stop: string
  total_user: number | null
  created_at: string
}

export function EmployeeReviewView({
  isCycleActive,
  profile,
  currentCycleId,
  selectedQuarter: controlledQuarter,
  onQuarterChange,
  showQuarterFilter = true,
}: {
  isCycleActive: boolean
  profile: ProfileSubset | null
  currentCycleId: string | null
  selectedQuarter?: QuarterFilterValue
  onQuarterChange?: (value: QuarterFilterValue) => void
  showQuarterFilter?: boolean
}) {
  const supabase = createClient()
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [summaryData, setSummaryData] = useState<SummaryRow | null>(null)
  const [internalQuarter, setInternalQuarter] =
    useState<QuarterFilterValue>("2025-Q1")
  const selectedQuarter = controlledQuarter ?? internalQuarter
  const setSelectedQuarter = onQuarterChange ?? setInternalQuarter
  const [totalReviewers, setTotalReviewers] = useState(0)

  // Calculate skill ratings using imported utilities
  const calculateSkillRatings = () => {
    if (!summaryData || !totalReviewers) return null
    const leadership = calculateSkillPercentage(
      Number(summaryData.score_leadership),
      totalReviewers,
    )
    const quality = calculateSkillPercentage(
      Number(summaryData.score_quality),
      totalReviewers,
    )
    const reliability = calculateSkillPercentage(
      Number(summaryData.score_reliability),
      totalReviewers,
    )
    const communication = calculateSkillPercentage(
      Number(summaryData.score_communication),
      totalReviewers,
    )
    const initiative = calculateSkillPercentage(
      Number(summaryData.score_initiative),
      totalReviewers,
    )

    return {
      leadership: getSkillRating(leadership),
      quality: getSkillRating(quality),
      reliability: getSkillRating(reliability),
      communication: getSkillRating(communication),
      initiative: getSkillRating(initiative),
    }
  }

  const skillRatings = calculateSkillRatings()

  // Data Fetching
  // Data Fetching
  useEffect(() => {
    const fetchMyResult = async () => {
      if (!profile?.id) return

      const cycleName = selectedQuarter
      let cycleIds: string[] = []

      if (!selectedQuarter.includes("All")) {
        const { data: cycles } = await supabase
          .from("review_cycles")
          .select("id")
          .eq("name", cycleName)

        cycleIds = (cycles || []).map((cycle) => cycle.id)
        if (cycleIds.length === 0) {
          setResult(null)
          setSummaryData(null)
          setTotalReviewers(0)
          return
        }
      }

      let summaryQuery = supabase
        .from("performance_summaries")
        .select("*")
        .eq("reviewee_id", profile.id)

      if (!selectedQuarter.includes("All")) {
        summaryQuery = summaryQuery.in("cycle_id", cycleIds)
      } else if (currentCycleId) {
        summaryQuery = summaryQuery.eq("cycle_id", currentCycleId)
      }

      const { data, error } = await summaryQuery
        .order("created_at", { ascending: false })
        .limit(1)

      if (error || !data || data.length === 0) {
        // Handle jika query sukses tapi datanya emang belum ada
        setResult(null)
        setSummaryData(null)
        setTotalReviewers(0)
        return
      }

      const row = data[0] as SummaryRow
      setSummaryData(row)
      setTotalReviewers(row.total_user || 0)

      const radarData = [
        { skill: "Quality", Self: 0, Peers: Number(row.score_quality) || 0 },
        {
          skill: "Reliability",
          Self: 0,
          Peers: Number(row.score_reliability) || 0,
        },
        {
          skill: "Communication",
          Self: 0,
          Peers: Number(row.score_communication) || 0,
        },
        {
          skill: "Initiative",
          Self: 0,
          Peers: Number(row.score_initiative) || 0,
        },
        {
          skill: "Leadership",
          Self: 0,
          Peers: Number(row.score_leadership) || 0,
        },
      ]

      setResult({
        radar: radarData,
        summary: {
          additional: row.additional_feedback || "Tidak ada ringkasan.",
          strength: row.feedback_continue || "Belum ada data.",
          growth: row.feedback_start || "Belum ada data.",
          stop: row.feedback_stop || "Belum ada data.",
        },
      })
    }

    fetchMyResult()
  }, [profile, currentCycleId, supabase, selectedQuarter])

  return (
    <div className="space-y-6">
      {/* 1. Quarter Filter */}
      {showQuarterFilter && (
        <QuarterFilter value={selectedQuarter} onChange={setSelectedQuarter} />
      )}

      {/* 3. STATS HEADER (SELALU MUNCUL) 
                Jika belum ada data, tampilkan nilai 0 atau "-" 
            */}
      <ReviewStatsHeader
        selectedQuarter={selectedQuarter}
        totalReviewers={totalReviewers}
        overallScore={summaryData ? Number(summaryData.overall_score) : 0}
        overallPercentage={summaryData ? summaryData.overall_percentage : 0}
        ratingLevel={
          summaryData ? getRatingLevel(summaryData.overall_percentage) : "-"
        }
        isCycleActive={isCycleActive}
      />

      {/* 4. CONTENT DETAIL (Accordion & Radar) */}
      {result ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {/* LEFT COLUMN - Accordion Feedback */}
          <div className="space-y-4">
            <Accordion type="multiple" defaultValue={["executive-summary"]}>
              <AccordionItem value="executive-summary">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Executive Summary</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-content-subtle dark:text-content-subtle text-body-sm whitespace-pre-line">
                    {result.summary.additional}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="keep-doing">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Badge variant="continue">CONTINUE</Badge>
                    <span className="font-medium">Keep Doing</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-content-subtle dark:text-content-subtle text-body-sm whitespace-pre-line">
                    {result.summary.strength}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="start-doing">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Badge variant="start">START</Badge>
                    <span className="font-medium">Start Doing</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-content-subtle dark:text-content-subtle text-body-sm whitespace-pre-line">
                    {result.summary.growth}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="stop-doing">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Badge variant="stop">STOP</Badge>
                    <span className="font-medium">Stop Doing</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-content-subtle dark:text-content-subtle text-body-sm whitespace-pre-line">
                    {result.summary.stop}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* RIGHT COLUMN - Competency Matrix */}
          <Card>
            <h3 className="text-content dark:text-content mb-4 font-semibold">
              Competency Matrix
            </h3>
            <div className="flex justify-center">
              <RadarChart
                data={result.radar}
                index="skill"
                categories={["Self", "Peers"]}
                colors={["indigo", "emerald"]}
                showLegend={false}
                showTooltip={false}
                className="h-64"
              />
            </div>
            {/* Skill Ratings List */}
            {skillRatings && (
              <div className="border-border mt-6 space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-content-subtle dark:text-content-subtle text-label-md">
                    Leadership
                  </span>
                  <Badge
                    variant={getRatingBadgeVariant(skillRatings.leadership)}
                  >
                    {skillRatings.leadership}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-content-subtle dark:text-content-subtle text-label-md">
                    Quality
                  </span>
                  <Badge variant={getRatingBadgeVariant(skillRatings.quality)}>
                    {skillRatings.quality}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-content-subtle dark:text-content-subtle text-label-md">
                    Reliability
                  </span>
                  <Badge
                    variant={getRatingBadgeVariant(skillRatings.reliability)}
                  >
                    {skillRatings.reliability}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-content-subtle dark:text-content-subtle text-label-md">
                    Communication
                  </span>
                  <Badge
                    variant={getRatingBadgeVariant(skillRatings.communication)}
                  >
                    {skillRatings.communication}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-content-subtle dark:text-content-subtle text-label-md">
                    Initiative
                  </span>
                  <Badge
                    variant={getRatingBadgeVariant(skillRatings.initiative)}
                  >
                    {skillRatings.initiative}
                  </Badge>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <EmptyState
          title={`Belum ada laporan performa untuk periode ${selectedQuarter}`}
          description="Hasil akan muncul setelah periode review selesai dan diproses Admin"
          icon={null}
          variant="compact"
        />
      )}
    </div>
  )
}
