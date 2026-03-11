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
      school_metrics: {
        Row: {
          chronic_absenteeism: number | null
          ela_growth_percentile: number | null
          ela_proficiency: number | null
          graduation_rate_4yr: number | null
          graduation_rate_5yr: number | null
          id: string
          isa_proficiency: number | null
          math_growth_percentile: number | null
          math_proficiency: number | null
          pct_9th_on_track: number | null
          school_id: string
          year: number
        }
        Insert: {
          chronic_absenteeism?: number | null
          ela_growth_percentile?: number | null
          ela_proficiency?: number | null
          graduation_rate_4yr?: number | null
          graduation_rate_5yr?: number | null
          id?: string
          isa_proficiency?: number | null
          math_growth_percentile?: number | null
          math_proficiency?: number | null
          pct_9th_on_track?: number | null
          school_id: string
          year: number
        }
        Update: {
          chronic_absenteeism?: number | null
          ela_growth_percentile?: number | null
          ela_proficiency?: number | null
          graduation_rate_4yr?: number | null
          graduation_rate_5yr?: number | null
          id?: string
          isa_proficiency?: number | null
          math_growth_percentile?: number | null
          math_proficiency?: number | null
          pct_9th_on_track?: number | null
          school_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "school_metrics_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      school_similarities: {
        Row: {
          d_diversity: number | null
          d_el: number | null
          d_fund_a: number | null
          d_fund_b: number | null
          d_hardship: number | null
          d_iep: number | null
          d_life_exp: number | null
          d_poverty: number | null
          d_stls: number | null
          d_teach_ret: number | null
          d_uninsured: number | null
          euclidean_distance: number
          goal_metric: string | null
          id: string
          rank: number
          school_id: string
          school_level: string
          similar_school_id: string
        }
        Insert: {
          d_diversity?: number | null
          d_el?: number | null
          d_fund_a?: number | null
          d_fund_b?: number | null
          d_hardship?: number | null
          d_iep?: number | null
          d_life_exp?: number | null
          d_poverty?: number | null
          d_stls?: number | null
          d_teach_ret?: number | null
          d_uninsured?: number | null
          euclidean_distance: number
          goal_metric?: string | null
          id?: string
          rank: number
          school_id: string
          school_level: string
          similar_school_id: string
        }
        Update: {
          d_diversity?: number | null
          d_el?: number | null
          d_fund_a?: number | null
          d_fund_b?: number | null
          d_hardship?: number | null
          d_iep?: number | null
          d_life_exp?: number | null
          d_poverty?: number | null
          d_stls?: number | null
          d_teach_ret?: number | null
          d_uninsured?: number | null
          euclidean_distance?: number
          goal_metric?: string | null
          id?: string
          rank?: number
          school_id?: string
          school_level?: string
          similar_school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_similarities_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "school_similarities_similar_school_id_fkey"
            columns: ["similar_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      schools: {
        Row: {
          school_id: string
          school_level: string
          school_name: string
          students: number | null
        }
        Insert: {
          school_id: string
          school_level: string
          school_name: string
          students?: number | null
        }
        Update: {
          school_id?: string
          school_level?: string
          school_name?: string
          students?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
