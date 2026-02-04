export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      // --- 1. PERFORMANCE REVIEWS (UPDATED) ---
      performance_reviews: {
        Row: {
          id: string
          cycle_id: string
          reviewer_id: string
          reviewee_id: string
          total_user: number | null

          // Scores
          score_quality: number | null
          score_reliability: number | null
          score_communication: number | null
          score_initiative: number | null
          score_leadership: number | null

          // Feedback Text
          feedback_start: string | null
          feedback_continue: string | null
          feedback_stop: string | null

          // Justification / Reason (Updated)
          justification_quality: string | null
          justification_reliability: string | null
          justification_communication: string | null
          justification_initiative: string | null
          justification_leadership: string | null

          processed_content: Json | null
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          cycle_id: string
          reviewer_id: string
          reviewee_id: string
          total_user?: number | null

          score_quality?: number | null
          score_reliability?: number | null
          score_communication?: number | null
          score_initiative?: number | null
          score_leadership?: number | null

          feedback_start?: string | null
          feedback_continue?: string | null
          feedback_stop?: string | null

          justification_quality?: string | null
          justification_reliability?: string | null
          justification_communication?: string | null
          justification_initiative?: string | null
          justification_leadership?: string | null

          processed_content?: Json | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          cycle_id?: string
          reviewer_id?: string
          reviewee_id?: string
          total_user?: number | null

          score_quality?: number | null
          score_reliability?: number | null
          score_communication?: number | null
          score_initiative?: number | null
          score_leadership?: number | null

          feedback_start?: string | null
          feedback_continue?: string | null
          feedback_stop?: string | null

          justification_quality?: string | null
          justification_reliability?: string | null
          justification_communication?: string | null
          justification_initiative?: string | null
          justification_leadership?: string | null

          processed_content?: Json | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }

      // --- 2. REVIEW CYCLES (NEW) ---
      review_cycles: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string | null
        }
        Relationships: []
      }

      // --- 3. PERFORMANCE SUMMARIES (NEW - HASIL AI) ---
      performance_summaries: {
        Row: {
          id: string
          reviewee_id: string
          cycle_id: string

          // Overall Stats
          overall_score: number | null
          overall_percentage: number | null

          // Category Scores
          score_quality: number | null
          score_reliability: number | null
          score_communication: number | null
          score_initiative: number | null
          score_leadership: number | null

          // AI Feedback Narrative
          additional_feedback: string | null
          feedback_continue: string | null
          feedback_start: string | null
          feedback_stop: string | null

          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          reviewee_id: string
          cycle_id: string

          overall_score?: number | null
          overall_percentage?: number | null

          score_quality?: number | null
          score_reliability?: number | null
          score_communication?: number | null
          score_initiative?: number | null
          score_leadership?: number | null

          additional_feedback?: string | null
          feedback_continue?: string | null
          feedback_start?: string | null
          feedback_stop?: string | null

          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          reviewee_id?: string
          cycle_id?: string

          overall_score?: number | null
          overall_percentage?: number | null

          score_quality?: number | null
          score_reliability?: number | null
          score_communication?: number | null
          score_initiative?: number | null
          score_leadership?: number | null

          additional_feedback?: string | null
          feedback_continue?: string | null
          feedback_start?: string | null
          feedback_stop?: string | null

          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_summaries_reviewee_id_fkey"
            columns: ["reviewee_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_summaries_cycle_id_fkey"
            columns: ["cycle_id"]
            referencedRelation: "review_cycles"
            referencedColumns: ["id"]
          },
        ]
      }

      // --- 4. KPI PROJECT TABLES (NEW) ---

      // 4.1 Projects
      projects: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          quarter_id: string | null // Generated column usually comes as string or null
          status: Database["public"]["Enums"]["project_status_enum"]
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          // quarter_id is generated, so we omit or make it optional (usually ignored on insert)
          status?: Database["public"]["Enums"]["project_status_enum"]
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          status?: Database["public"]["Enums"]["project_status_enum"]
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      // 4.2 Competency Library (Master Data)
      competency_library: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["project_role_enum"]
          name: string
          description: string | null
          category: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["project_role_enum"]
          name: string
          description?: string | null
          category?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["project_role_enum"]
          name?: string
          description?: string | null
          category?: string | null
          created_at?: string | null
        }
        Relationships: []
      }

      // 4.3 Project Assignments
      project_assignments: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role_in_project: Database["public"]["Enums"]["project_role_enum"]
          weight_in_quarter: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role_in_project: Database["public"]["Enums"]["project_role_enum"]
          weight_in_quarter?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role_in_project?: Database["public"]["Enums"]["project_role_enum"]
          weight_in_quarter?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }

      // 4.4 SLA Scores
      project_sla_scores: {
        Row: {
          id: string
          assignment_id: string
          milestone_name: string
          weight_percentage: number
          actual_result: string // "Faster", "On Time", "Delay"
          score_achieved: number
          score_target: number
          created_at: string | null
        }
        Insert: {
          id?: string
          assignment_id: string
          milestone_name: string
          weight_percentage: number
          actual_result: string
          score_achieved: number
          score_target?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          milestone_name?: string
          weight_percentage?: number
          actual_result?: string
          score_achieved?: number
          score_target?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_sla_scores_assignment_id_fkey"
            columns: ["assignment_id"]
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
        ]
      }

      // 4.5 Work Quality Scores
      project_work_quality_scores: {
        Row: {
          id: string
          assignment_id: string
          competency_id: string
          is_achieved: boolean | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          assignment_id: string
          competency_id: string
          is_achieved?: boolean | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          competency_id?: string
          is_achieved?: boolean | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_work_quality_scores_assignment_id_fkey"
            columns: ["assignment_id"]
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_work_quality_scores_competency_id_fkey"
            columns: ["competency_id"]
            referencedRelation: "competency_library"
            referencedColumns: ["id"]
          },
        ]
      }

      // --- EXISTING TABLES (TIDAK BERUBAH) ---
      attendance_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          clock_in: string
          clock_out: string | null
          is_break: boolean | null
          break_start: string | null
          break_total: number | null
          status: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          clock_in?: string
          clock_out?: string | null
          is_break?: boolean | null
          break_start?: string | null
          break_total?: number | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          clock_in?: string
          clock_out?: string | null
          is_break?: boolean | null
          break_start?: string | null
          break_total?: number | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string | null
          end_date: string
          id: number
          leave_type: string
          proof_url: string | null
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: number
          leave_type?: string
          proof_url?: string | null
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: number
          leave_type?: string
          proof_url?: string | null
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          id: string
          name: string | null
          code: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          code?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          code?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string
          job_title: string | null
          krt_id: string | null
          leave_balance: number | null
          leave_used: number | null
          role: Database["public"]["Enums"]["app_role"]
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id: string
          job_title?: string | null
          krt_id?: string | null
          leave_balance?: number | null
          leave_used?: number | null
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          job_title?: string | null
          krt_id?: string | null
          leave_balance?: number | null
          leave_used?: number | null
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "stakeholder" | "employee"
      job_title: "Admin" | "Project Manager" | "Designer" | "Web Developer"
      request_status: "pending" | "approved" | "rejected"
      // ADDED NEW ENUMS
      project_status_enum: "Active" | "Completed" | "Archived"
      project_role_enum:
        | "UIX Designer"
        | "Brand Designer"
        | "Web Developer"
        | "Project Manager"
        | "Admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
  TableName extends PublicTableNameOrOptions extends {
    schema: Exclude<keyof Database, "__InternalSupabase">
  }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends {
  schema: Exclude<keyof Database, "__InternalSupabase">
}
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
  TableName extends PublicTableNameOrOptions extends {
    schema: Exclude<keyof Database, "__InternalSupabase">
  }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends {
  schema: Exclude<keyof Database, "__InternalSupabase">
}
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
  TableName extends PublicTableNameOrOptions extends {
    schema: Exclude<keyof Database, "__InternalSupabase">
  }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends {
  schema: Exclude<keyof Database, "__InternalSupabase">
}
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: Exclude<keyof Database, "__InternalSupabase">
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: Exclude<keyof Database, "__InternalSupabase">
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: Exclude<keyof Database, "__InternalSupabase">
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: Exclude<keyof Database, "__InternalSupabase">
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["stakeholder", "employee"],
      job_title: ["Admin", "Project Manager", "Designer", "Web Developer"],
      request_status: ["pending", "approved", "rejected"],
      // ADDED NEW CONSTANTS
      project_status_enum: ["Active", "Completed", "Archived"],
      project_role_enum: [
        "UIX Designer",
        "Brand Designer",
        "Web Developer",
        "Project Manager",
        "Admin",
      ],
    },
  },
} as const
