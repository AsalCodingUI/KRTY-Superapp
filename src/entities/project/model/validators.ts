import { z } from "zod"

/**
 * Project Validators
 * Zod schemas for validating project-related input data
 */

export const CreateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(200, "Project name must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .nullable(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
})

export const UpdateProjectSchema = CreateProjectSchema.extend({
  status: z.enum(["Active", "Completed", "Archived"]),
})

export const ProjectAssignmentSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  userId: z.string().uuid("Invalid user ID"),
  role: z.enum([
    "Project Manager",
    "Developer",
    "Designer",
    "QA",
    "DevOps",
    "Other",
  ]),
  weight: z.number().min(0).max(100).optional(),
  isLead: z.boolean().optional(),
})

export const SLAMilestoneSchema = z.object({
  name: z.string().min(1, "Milestone name is required"),
  weight: z.number().min(0).max(100),
  result: z.enum(["Faster", "On Time", "Delay"]),
  scoreAchieved: z.number().min(0),
  targetPercentage: z.number().min(0).max(200),
})

export const SaveSLAScoresSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment ID"),
  milestones: z.array(SLAMilestoneSchema),
})

export const WorkQualityScoreSchema = z.object({
  competencyId: z.string().uuid("Invalid competency ID"),
  isAchieved: z.boolean(),
})

export const SaveWorkQualityScoresSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment ID"),
  competencies: z.array(WorkQualityScoreSchema),
})

// Type exports
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
export type ProjectAssignmentInput = z.infer<typeof ProjectAssignmentSchema>
export type SLAMilestoneInput = z.infer<typeof SLAMilestoneSchema>
export type SaveSLAScoresInput = z.infer<typeof SaveSLAScoresSchema>
export type WorkQualityScoreInput = z.infer<typeof WorkQualityScoreSchema>
export type SaveWorkQualityScoresInput = z.infer<
  typeof SaveWorkQualityScoresSchema
>
