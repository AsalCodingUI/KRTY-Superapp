import { createClient } from "@/shared/api/supabase/client"
import { Database } from "@/shared/types/database.types"

type ProjectRoleEnum = Database["public"]["Enums"]["project_role_enum"]

export interface ProjectMemberInput {
  userId: string
  role: ProjectRoleEnum
  isLead: boolean
  weight?: number | null
}

export interface RoleConfig {
  id: string
  job_title_pattern: string
  target_role: ProjectRoleEnum
  priority: number
}

let roleConfigCache: RoleConfig[] | null = null
let roleConfigTimestamp = 0
const CACHE_TTL = 1000 * 60 * 5 // 5 minutes

export const projectService = {
  /**
   * Fetches project role configuration from the database.
   * Uses simple in-memory caching to prevent redundant DB hits.
   */
  async getRoleConfigs(): Promise<RoleConfig[]> {
    const now = Date.now()
    if (roleConfigCache && now - roleConfigTimestamp < CACHE_TTL) {
      return roleConfigCache
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("project_role_config")
      .select("*")
      .order("priority", { ascending: false })

    if (error) {
      console.error("Failed to fetch role configs:", error)
      // Fallback to empty array to prevent crash, caller handles defaults
      return []
    }

    roleConfigCache = data
    roleConfigTimestamp = now
    return data
  },

  /**
   * Determines the project role for a given job title based on DB rules.
   */
  async determineRole(jobTitle: string | null): Promise<ProjectRoleEnum> {
    if (!jobTitle) return "Webflow Developer" // Default

    const configs = await this.getRoleConfigs()

    for (const config of configs) {
      // Case-insensitive regex-like match implementation
      const pattern = config.job_title_pattern.replace(/%/g, ".*")
      const regex = new RegExp(`^${pattern}$`, "i")

      if (
        regex.test(jobTitle) ||
        jobTitle
          .toLowerCase()
          .includes(config.job_title_pattern.toLowerCase().replace(/%/g, ""))
      ) {
        return config.target_role
      }
    }

    return "Webflow Developer" // Fallback Default
  },

  /**
   * Executes the ACID transaction to assign members to a project.
   * Replaces the O(N) loop.
   */
  async bulkAssignMembers(projectId: string, members: ProjectMemberInput[]) {
    const supabase = createClient()

    // Sanitize input for the RPC
    const payload = members.map((m) => ({
      userId: m.userId,
      role: m.role,
      isLead: m.isLead,
      weight: m.weight || 100, // Default weight
    }))

    const { error } = await supabase.rpc("bulk_assign_project_members", {
      p_project_id: projectId,
      p_members: payload,
    })

    if (error) {
      console.error("RPC bulk_assign_project_members failed:", error)
      throw new Error(error.message)
    }

    return { success: true }
  },
}
