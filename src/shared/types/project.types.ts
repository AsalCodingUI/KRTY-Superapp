import { Database, Tables, TablesInsert, TablesUpdate } from "./database.types"

// --- Projects ---
export type Project = Tables<"projects">
export type ProjectInsert = TablesInsert<"projects">
export type ProjectUpdate = TablesUpdate<"projects">

// --- Project Assignments ---
export type ProjectAssignment = Tables<"project_assignments">
export type ProjectAssignmentInsert = TablesInsert<"project_assignments">
export type ProjectAssignmentUpdate = TablesUpdate<"project_assignments">

// --- Project SLA Scores ---
export type ProjectSlaScore = Tables<"project_sla_scores">
export type ProjectSlaScoreInsert = TablesInsert<"project_sla_scores">
export type ProjectSlaScoreUpdate = TablesUpdate<"project_sla_scores">

// --- Project Work Quality Scores ---
export type ProjectWorkQualityScore = Tables<"project_work_quality_scores">
export type ProjectWorkQualityScoreInsert = TablesInsert<"project_work_quality_scores">
export type ProjectWorkQualityScoreUpdate = TablesUpdate<"project_work_quality_scores">

// --- Project Calculations ---
export type ProjectCalculation = Tables<"project_calculations">
export type ProjectCalculationInsert = TablesInsert<"project_calculations">
export type ProjectCalculationUpdate = TablesUpdate<"project_calculations">

// --- SLAs ---
export type Sla = Tables<"slas">
export type SlaInsert = TablesInsert<"slas">
export type SlaUpdate = TablesUpdate<"slas">

// --- Enums ---
export type ProjectRoleEnum = Database["public"]["Enums"]["project_role_enum"]
export type ProjectStatusEnum = Database["public"]["Enums"]["project_status_enum"]
