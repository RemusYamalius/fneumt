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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      join_requests: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      local_office_members: {
        Row: {
          created_at: string
          id: string
          office_id: string
          position: Database["public"]["Enums"]["office_position"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          office_id: string
          position: Database["public"]["Enums"]["office_position"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          office_id?: string
          position?: Database["public"]["Enums"]["office_position"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_office_members_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "local_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      local_offices: {
        Row: {
          academy: string | null
          coordinator_id: string
          created_at: string
          directorate: string | null
          id: string
          office_name: string | null
          secretary_photo_url: string | null
          updated_at: string
        }
        Insert: {
          academy?: string | null
          coordinator_id: string
          created_at?: string
          directorate?: string | null
          id?: string
          office_name?: string | null
          secretary_photo_url?: string | null
          updated_at?: string
        }
        Update: {
          academy?: string | null
          coordinator_id?: string
          created_at?: string
          directorate?: string | null
          id?: string
          office_name?: string | null
          secretary_photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      membership_cards: {
        Row: {
          card_number: string | null
          created_at: string
          id: string
          is_paid: boolean
          member_user_id: string
          office_id: string
          updated_at: string
        }
        Insert: {
          card_number?: string | null
          created_at?: string
          id?: string
          is_paid?: boolean
          member_user_id: string
          office_id: string
          updated_at?: string
        }
        Update: {
          card_number?: string | null
          created_at?: string
          id?: string
          is_paid?: boolean
          member_user_id?: string
          office_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_cards_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "local_offices"
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
      office_finances: {
        Row: {
          id: string
          office_id: string
          paid_to_provincial: number
          remaining: number
          total_collected: number
          updated_at: string
        }
        Insert: {
          id?: string
          office_id: string
          paid_to_provincial?: number
          remaining?: number
          total_collected?: number
          updated_at?: string
        }
        Update: {
          id?: string
          office_id?: string
          paid_to_provincial?: number
          remaining?: number
          total_collected?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_finances_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: true
            referencedRelation: "local_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      post_attachments: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          post_id: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          post_id: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_attachments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_attachments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_recipients: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          post_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          post_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          post_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_recipients_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_recipients_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string | null
          created_at: string
          filters: Json | null
          id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content?: string | null
          created_at?: string
          filters?: Json | null
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string | null
          created_at?: string
          filters?: Json | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          academy: string | null
          corps: Database["public"]["Enums"]["corps_type"] | null
          created_at: string
          date_of_birth: string | null
          directorate: string | null
          email: string | null
          employee_number: string | null
          full_name: string | null
          gender: string | null
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
          date_of_birth?: string | null
          directorate?: string | null
          email?: string | null
          employee_number?: string | null
          full_name?: string | null
          gender?: string | null
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
          date_of_birth?: string | null
          directorate?: string | null
          email?: string | null
          employee_number?: string | null
          full_name?: string | null
          gender?: string | null
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      post_with_author: {
        Row: {
          author_id: string | null
          author_name: string | null
          content: string | null
          created_at: string | null
          filters: Json | null
          id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_attachment_file: {
        Args: { _file_path: string; _user_id: string }
        Returns: boolean
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
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
      is_office_coordinator: {
        Args: { _office_id: string; _user_id: string }
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
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
        | "national_secretary"
        | "deputy_national_secretary"
      corps_type: "primary" | "middle_school" | "high_school" | "administrative"
      office_position:
        | "local_secretary"
        | "deputy_secretary_primary"
        | "deputy_secretary_middle"
        | "deputy_secretary_high"
        | "treasurer"
        | "deputy_treasurer"
        | "rapporteur"
        | "deputy_rapporteur"
        | "advisor"
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
        "national_secretary",
        "deputy_national_secretary",
      ],
      corps_type: ["primary", "middle_school", "high_school", "administrative"],
      office_position: [
        "local_secretary",
        "deputy_secretary_primary",
        "deputy_secretary_middle",
        "deputy_secretary_high",
        "treasurer",
        "deputy_treasurer",
        "rapporteur",
        "deputy_rapporteur",
        "advisor",
      ],
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
