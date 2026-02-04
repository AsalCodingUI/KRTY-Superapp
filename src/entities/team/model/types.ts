import { Database } from "@/shared/types/database.types"

export type TeamMember = Database["public"]["Tables"]["profiles"]["Row"]

export interface TeamStats {
  totalMembers: number
  statsByJobTitle: {
    jobTitle: string
    count: number
    percentage: number
  }[]
}

export interface TeamFormData {
  id?: string
  full_name: string
  email: string
  hourly_rate: number
}
