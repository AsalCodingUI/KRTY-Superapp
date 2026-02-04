import type { Database } from "@/shared/types"

export type User = Database["public"]["Tables"]["profiles"]["Row"]

export type UserRole = "employee" | "stakeholder"

export interface UserProfile {
    id: string
    full_name: string | null
    email: string
    role: UserRole
    job_title: string | null
    krt_id: string | null
    hourly_rate: number | null
    team_id: string | null
    avatar_url?: string | null
}
