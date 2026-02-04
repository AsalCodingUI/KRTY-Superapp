import type { Database } from "./database.types"

export type PerformanceReview =
  Database["public"]["Tables"]["performance_reviews"]["Row"]
export type ReviewCycle = Database["public"]["Tables"]["review_cycles"]["Row"]
export type PerformanceSummary =
  Database["public"]["Tables"]["performance_summaries"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

export interface PerformanceReviewWithProfile extends PerformanceReview {
  profiles?: {
    full_name: string | null
    avatar_url: string | null
    job_title: string | null
  } | null
}

export interface PendingReviewData {
  employee_id: string
  cycle_id: string
  profiles: Array<{
    full_name: string | null
    avatar_url: string | null
    job_title: string | null
  }>
  review_cycles: Array<{
    name: string
  }>
}

export interface ReviewSummaryWithProfile {
  employee_id: string
  overall_percentage: number
  profiles: Array<{
    full_name: string | null
    avatar_url: string | null
    job_title: string | null
  }>
}

export interface RecentReviewActivity {
  created_at: string
  employee_id: string
  profiles: Array<{
    full_name: string | null
    avatar_url: string | null
  }>
}

export interface LeaveRequestWithProfile extends LeaveRequest {
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

export interface PeerReviewScores {
  score_leadership: number
  score_quality: number
  score_reliability: number
  score_communication: number
  score_initiative: number
}

export interface ProjectAssignmentWithScores {
  id: string
  projects: {
    id: string
    name: string
    status: string
    quarter_id: string
    end_date: string
  }
  project_sla_scores: Array<{
    score_achieved: number
    weight_percentage: number
  }>
  project_work_quality_scores: Array<{
    is_achieved: boolean
  }>
}
