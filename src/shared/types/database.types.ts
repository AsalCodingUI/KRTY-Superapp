export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance_logs: {
        Row: {
          break_start: string | null
          break_total: number | null
          clock_in: string
          clock_out: string | null
          created_at: string | null
          date: string
          id: string
          is_break: boolean | null
          notes: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          break_start?: string | null
          break_total?: number | null
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_break?: boolean | null
          notes?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          break_start?: string | null
          break_total?: number | null
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_break?: boolean | null
          notes?: string | null
          status?: string | null
          user_id?: string
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
      calendar_events: {
        Row: {
          all_day: boolean | null
          color: string
          created_at: string
          description: string | null
          end_at: string
          event_type: string | null
          guests: Json | null
          id: string
          is_recurring: boolean | null
          location: string | null
          meeting_url: string | null
          organizer: string | null
          project_id: string | null
          recurrence_rule: string | null
          reminders: Json | null
          rsvp_status: string | null
          start_at: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          all_day?: boolean | null
          color: string
          created_at?: string
          description?: string | null
          end_at: string
          event_type?: string | null
          guests?: Json | null
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          meeting_url?: string | null
          organizer?: string | null
          project_id?: string | null
          recurrence_rule?: string | null
          reminders?: Json | null
          rsvp_status?: string | null
          start_at: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          all_day?: boolean | null
          color?: string
          created_at?: string
          description?: string | null
          end_at?: string
          event_type?: string | null
          guests?: Json | null
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          meeting_url?: string | null
          organizer?: string | null
          project_id?: string | null
          recurrence_rule?: string | null
          reminders?: Json | null
          rsvp_status?: string | null
          start_at?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "employee_kpi_overview"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_library: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          role: Database["public"]["Enums"]["project_role_enum"]
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          role: Database["public"]["Enums"]["project_role_enum"]
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["project_role_enum"]
        }
        Relationships: []
      }
      internal_calendar_events: {
        Row: {
          assigned_emails: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string
          event_type: string | null
          google_event_id: string | null
          id: string
          start_time: string
          title: string
        }
        Insert: {
          assigned_emails?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time: string
          event_type?: string | null
          google_event_id?: string | null
          id?: string
          start_time: string
          title: string
        }
        Update: {
          assigned_emails?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string
          event_type?: string | null
          google_event_id?: string | null
          id?: string
          start_time?: string
          title?: string
        }
        Relationships: []
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
      one_on_one_slots: {
        Row: {
          booked_at: string | null
          booked_by: string | null
          created_at: string | null
          cycle_name: string
          end_at: string
          google_event_id: string | null
          id: string
          location: string | null
          meeting_url: string | null
          mode: string
          organizer_id: string | null
          start_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          booked_at?: string | null
          booked_by?: string | null
          created_at?: string | null
          cycle_name: string
          end_at: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          meeting_url?: string | null
          mode: string
          organizer_id?: string | null
          start_at: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          booked_at?: string | null
          booked_by?: string | null
          created_at?: string | null
          cycle_name?: string
          end_at?: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          meeting_url?: string | null
          mode?: string
          organizer_id?: string | null
          start_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_slots_booked_by_fkey"
            columns: ["booked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_slots_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          created_at: string | null
          cycle_id: string
          feedback_continue: string | null
          feedback_start: string | null
          feedback_stop: string | null
          id: string
          justification_communication: string | null
          justification_initiative: string | null
          justification_leadership: string | null
          justification_quality: string | null
          justification_reliability: string | null
          processed_content: Json | null
          reviewee_id: string
          reviewer_id: string
          score_communication: number | null
          score_initiative: number | null
          score_leadership: number | null
          score_quality: number | null
          score_reliability: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cycle_id: string
          feedback_continue?: string | null
          feedback_start?: string | null
          feedback_stop?: string | null
          id?: string
          justification_communication?: string | null
          justification_initiative?: string | null
          justification_leadership?: string | null
          justification_quality?: string | null
          justification_reliability?: string | null
          processed_content?: Json | null
          reviewee_id: string
          reviewer_id: string
          score_communication?: number | null
          score_initiative?: number | null
          score_leadership?: number | null
          score_quality?: number | null
          score_reliability?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cycle_id?: string
          feedback_continue?: string | null
          feedback_start?: string | null
          feedback_stop?: string | null
          id?: string
          justification_communication?: string | null
          justification_initiative?: string | null
          justification_leadership?: string | null
          justification_quality?: string | null
          justification_reliability?: string | null
          processed_content?: Json | null
          reviewee_id?: string
          reviewer_id?: string
          score_communication?: number | null
          score_initiative?: number | null
          score_leadership?: number | null
          score_quality?: number | null
          score_reliability?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_summaries: {
        Row: {
          additional_feedback: string | null
          created_at: string | null
          cycle_id: string
          feedback_continue: string | null
          feedback_start: string | null
          feedback_stop: string | null
          id: string
          overall_percentage: number | null
          overall_score: number | null
          reviewee_id: string
          score_communication: number | null
          score_initiative: number | null
          score_leadership: number | null
          score_quality: number | null
          score_reliability: number | null
          total_user: number | null
          updated_at: string | null
        }
        Insert: {
          additional_feedback?: string | null
          created_at?: string | null
          cycle_id: string
          feedback_continue?: string | null
          feedback_start?: string | null
          feedback_stop?: string | null
          id?: string
          overall_percentage?: number | null
          overall_score?: number | null
          reviewee_id: string
          score_communication?: number | null
          score_initiative?: number | null
          score_leadership?: number | null
          score_quality?: number | null
          score_reliability?: number | null
          total_user?: number | null
          updated_at?: string | null
        }
        Update: {
          additional_feedback?: string | null
          created_at?: string | null
          cycle_id?: string
          feedback_continue?: string | null
          feedback_start?: string | null
          feedback_stop?: string | null
          id?: string
          overall_percentage?: number | null
          overall_score?: number | null
          reviewee_id?: string
          score_communication?: number | null
          score_initiative?: number | null
          score_leadership?: number | null
          score_quality?: number | null
          score_reliability?: number | null
          total_user?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_summaries_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "review_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_summaries_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string
          job_title: Database["public"]["Enums"]["job_title"]
          krt_id: string
          leave_balance: number
          leave_used: number
          manager_id: string | null
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
          job_title?: Database["public"]["Enums"]["job_title"]
          krt_id?: string
          leave_balance?: number
          leave_used?: number
          manager_id?: string | null
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
          job_title?: Database["public"]["Enums"]["job_title"]
          krt_id?: string
          leave_balance?: number
          leave_used?: number
          manager_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      project_assignments: {
        Row: {
          created_at: string | null
          id: string
          is_lead: boolean | null
          project_id: string
          role_in_project: Database["public"]["Enums"]["project_role_enum"]
          user_id: string
          weight_in_quarter: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_lead?: boolean | null
          project_id: string
          role_in_project: Database["public"]["Enums"]["project_role_enum"]
          user_id: string
          weight_in_quarter?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_lead?: boolean | null
          project_id?: string
          role_in_project?: Database["public"]["Enums"]["project_role_enum"]
          user_id?: string
          weight_in_quarter?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "employee_kpi_overview"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_sla_scores: {
        Row: {
          actual_result: string
          assignment_id: string
          created_at: string | null
          id: string
          milestone_name: string
          score_achieved: number
          score_target: number | null
          target_percentage: number | null
          weight_percentage: number
        }
        Insert: {
          actual_result: string
          assignment_id: string
          created_at?: string | null
          id?: string
          milestone_name: string
          score_achieved: number
          score_target?: number | null
          target_percentage?: number | null
          weight_percentage: number
        }
        Update: {
          actual_result?: string
          assignment_id?: string
          created_at?: string | null
          id?: string
          milestone_name?: string
          score_achieved?: number
          score_target?: number | null
          target_percentage?: number | null
          weight_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_sla_scores_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      project_work_quality_scores: {
        Row: {
          assignment_id: string
          competency_id: string
          created_at: string | null
          id: string
          is_achieved: boolean | null
          notes: string | null
        }
        Insert: {
          assignment_id: string
          competency_id: string
          created_at?: string | null
          id?: string
          is_achieved?: boolean | null
          notes?: string | null
        }
        Update: {
          assignment_id?: string
          competency_id?: string
          created_at?: string | null
          id?: string
          is_achieved?: boolean | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_work_quality_scores_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_work_quality_scores_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competency_library"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          name: string
          quarter_id: string
          start_date: string
          status: Database["public"]["Enums"]["project_status_enum"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          name: string
          quarter_id: string
          start_date: string
          status?: Database["public"]["Enums"]["project_status_enum"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          quarter_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["project_status_enum"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      review_cycles: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      slas: {
        Row: {
          agency_info: Json
          archived_at: string | null
          client_info: Json
          client_name: string
          created_at: string
          id: string
          milestones: Json
          project_name: string
          scope_of_work: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_info?: Json
          archived_at?: string | null
          client_info?: Json
          client_name: string
          created_at?: string
          id?: string
          milestones?: Json
          project_name: string
          scope_of_work?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_info?: Json
          archived_at?: string | null
          client_info?: Json
          client_name?: string
          created_at?: string
          id?: string
          milestones?: Json
          project_name?: string
          scope_of_work?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      employee_kpi_overview: {
        Row: {
          full_name: string | null
          project_id: string | null
          project_kpi: number | null
          project_name: string | null
          quality_score: number | null
          quarter_id: string | null
          sla_score: number | null
          user_id: string | null
          weight_in_quarter: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_working_days: {
        Args: { end_date: string; start_date: string }
        Returns: number
      }
      get_dashboard_stats: { Args: { quarter_input: string }; Returns: Json }
      get_kpi_rating: { Args: { p_score: number }; Returns: string }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_quarter_kpi: {
        Args: { p_quarter_id: string; p_user_id: string }
        Returns: number
      }
      is_stakeholder: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "stakeholder" | "employee"
      job_title: "Admin" | "Project Manager" | "Designer" | "Web Developer"
      project_role_enum:
        | "UIX Designer"
        | "Brand Designer"
        | "Webflow Developer"
        | "Project Manager"
        | "Admin"
      project_status_enum: "Active" | "Completed" | "Archived"
      request_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["stakeholder", "employee"],
      job_title: ["Admin", "Project Manager", "Designer", "Web Developer"],
      project_role_enum: [
        "UIX Designer",
        "Brand Designer",
        "Webflow Developer",
        "Project Manager",
        "Admin",
      ],
      project_status_enum: ["Active", "Completed", "Archived"],
      request_status: ["pending", "approved", "rejected"],
    },
  },
} as const
