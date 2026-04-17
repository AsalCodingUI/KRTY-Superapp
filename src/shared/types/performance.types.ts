import { Tables, TablesInsert, TablesUpdate } from "./database.types"

// --- Performance Reviews ---
export type PerformanceReview = Tables<"performance_reviews">
export type PerformanceReviewInsert = TablesInsert<"performance_reviews">
export type PerformanceReviewUpdate = TablesUpdate<"performance_reviews">

// --- Performance Summaries ---
export type PerformanceSummary = Tables<"performance_summaries">
export type PerformanceSummaryInsert = TablesInsert<"performance_summaries">
export type PerformanceSummaryUpdate = TablesUpdate<"performance_summaries">

// --- Review Cycles ---
export type ReviewCycle = Tables<"review_cycles">
export type ReviewCycleInsert = TablesInsert<"review_cycles">
export type ReviewCycleUpdate = TablesUpdate<"review_cycles">

// --- Competency Library ---
export type CompetencyLibrary = Tables<"competency_library">
export type CompetencyLibraryInsert = TablesInsert<"competency_library">
export type CompetencyLibraryUpdate = TablesUpdate<"competency_library">

// --- Employee KPI Overview (view) ---
export type EmployeeKpiOverview = Tables<"employee_kpi_overview">
