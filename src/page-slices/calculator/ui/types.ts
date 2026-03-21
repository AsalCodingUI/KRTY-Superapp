import { Database } from "@/shared/types/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export type TeamMember = Pick<
  Profile,
  "id" | "full_name" | "job_title" | "hourly_rate" | "monthly_salary"
>

export type OperationalCost =
  Database["public"]["Tables"]["operational_costs"]["Row"]

export interface Phase {
  id: string
  name: string
  days: number
  buffer: number
}

export interface SquadMember {
  id: string
  profileId: string
  allocation: number
}

export interface FreelanceMember {
  id: string
  name: string
  role: string
  totalFee: string
  notes: string
}
