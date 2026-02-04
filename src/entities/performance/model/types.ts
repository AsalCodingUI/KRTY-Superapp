export interface PerformanceScore {
  id: string
  employeeId: string
  quarterId: string
  slaScore: number | null
  reviewScore: number | null
  qualityScore: number | null
  overallScore: number | null
  ratingLevel: string | null
}

export interface KPIMetric {
  objective: string
  keyResult: string
  weighted: number | null
  target: number
  result: number | null
  projectId: string | null
  assignmentId: string | null
}

export interface ReviewData {
  reviewerId: string
  revieweeId: string
  quarterId: string
  score: number
  feedback: string
  competencies: {
    name: string
    score: number
  }[]
}

export interface PerformanceOverview {
  employeeId: string
  quarterId: string
  metrics: KPIMetric[]
  overallScore: number | null
  ratingLevel: string | null
}
