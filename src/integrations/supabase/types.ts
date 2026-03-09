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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          request_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          request_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          request_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          request_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          request_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          academy: string | null
          corps: Database["public"]["Enums"]["corps_type"] | null
          created_at: string
          directorate: string | null
          email: string | null
          employee_number: string | null
          full_name: string | null
          id: string
          institution: string | null
          is_member: boolean | null
          membership_card_number: string | null
          membership_verified: boolean | null
          mission: string | null
          phone: string | null
          updated_at: string
          user_id: string
          zone: string | null
        }
        Insert: {
          academy?: string | null
          corps?: Database["public"]["Enums"]["corps_type"] | null
          created_at?: string
          directorate?: string | null
          email?: string | null
          employee_number?: string | null
          full_name?: string | null
          id?: string
          institution?: string | null
          is_member?: boolean | null
          membership_card_number?: string | null
          membership_verified?: boolean | null
          mission?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          zone?: string | null
        }
        Update: {
          academy?: string | null
          corps?: Database["public"]["Enums"]["corps_type"] | null
          created_at?: string
          directorate?: string | null
          email?: string | null
          employee_number?: string | null
          full_name?: string | null
          id?: string
          institution?: string | null
          is_member?: boolean | null
          membership_card_number?: string | null
          membership_verified?: boolean | null
          mission?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          zone?: string | null
        }
        Relationships: []
      }
      request_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["request_status"]
          note: string | null
          old_status: Database["public"]["Enums"]["request_status"] | null
          request_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["request_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["request_status"] | null
          request_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["request_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["request_status"] | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_status_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["request_category"]
          created_at: string
          description: string | null
          id: string
          resolution_level: string | null
          status: Database["public"]["Enums"]["request_status"]
          subject: string
          tracking_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category: Database["public"]["Enums"]["request_category"]
          created_at?: string
          description?: string | null
          id?: string
          resolution_level?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          subject: string
          tracking_number?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["request_category"]
          created_at?: string
          description?: string | null
          id?: string
          resolution_level?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          subject?: string
          tracking_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          promoted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          promoted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          promoted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_attachment_file: {
        Args: { _file_path: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_area_coordinator: {
        Args: { _coordinator_id: string; _deputy_user_id: string }
        Returns: boolean
      }
      is_assigned_officer: {
        Args: { _request_id: string; _user_id: string }
        Returns: boolean
      }
      is_promoter: { Args: { _user_id: string }; Returns: boolean }
      is_request_owner: {
        Args: { _request_id: string; _user_id: string }
        Returns: boolean
      }
      is_same_area_deputy: {
        Args: { _target_user_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "teacher"
        | "union_officer"
        | "admin"
        | "regional_supervisor"
        | "deputy_regional_primary"
        | "deputy_regional_middle"
        | "deputy_regional_high"
        | "provincial_manager"
        | "deputy_provincial_primary"
        | "deputy_provincial_middle"
        | "deputy_provincial_high"
        | "local_coordinator"
        | "deputy_local_primary"
        | "deputy_local_middle"
        | "deputy_local_high"
      corps_type: "primary" | "middle_school" | "high_school" | "administrative"
      request_category:
        | "medical_file"
        | "mohammed_vi_foundation"
        | "promotions"
        | "transfer"
        | "assets"
        | "subscriptions"
        | "scholarships"
        | "rank_promotion"
        | "grade_promotion"
        | "schedules"
        | "infrastructure"
        | "financial_compensation"
        | "zone_compensation"
        | "equipment"
        | "grievances"
        | "assignments"
        | "inspection_score"
        | "other"
      request_status:
        | "submitted"
        | "viewed"
        | "in_progress"
        | "accepted"
        | "cancelled"
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
      app_role: [
        "teacher",
        "union_officer",
        "admin",
        "regional_supervisor",
        "deputy_regional_primary",
        "deputy_regional_middle",
        "deputy_regional_high",
        "provincial_manager",
        "deputy_provincial_primary",
        "deputy_provincial_middle",
        "deputy_provincial_high",
        "local_coordinator",
        "deputy_local_primary",
        "deputy_local_middle",
        "deputy_local_high",
      ],
      corps_type: ["primary", "middle_school", "high_school", "administrative"],
      request_category: [
        "medical_file",
        "mohammed_vi_foundation",
        "promotions",
        "transfer",
        "assets",
        "subscriptions",
        "scholarships",
        "rank_promotion",
        "grade_promotion",
        "schedules",
        "infrastructure",
        "financial_compensation",
        "zone_compensation",
        "equipment",
        "grievances",
        "assignments",
        "inspection_score",
        "other",
      ],
      request_status: [
        "submitted",
        "viewed",
        "in_progress",
        "accepted",
        "cancelled",
      ],
    },
  },
} as const
