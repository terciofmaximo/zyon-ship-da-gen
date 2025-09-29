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
      pdas: {
        Row: {
          agency_fee: number | null
          beam: string | null
          berth: string | null
          cargo: string | null
          clearance: number | null
          comments: Json | null
          created_at: string
          created_by: string | null
          date_field: string | null
          days_alongside: string | null
          dockage: number | null
          draft: string | null
          dwt: string | null
          exchange_rate: string | null
          exchange_rate_source: string | null
          exchange_rate_source_url: string | null
          exchange_rate_timestamp: string | null
          free_pratique: number | null
          from_location: string | null
          id: string
          immigration: number | null
          imo_number: string | null
          launch_boat: number | null
          light_dues: number | null
          linesman: number | null
          loa: string | null
          paperless_port: number | null
          pda_number: string
          pilotage_in: number | null
          port_name: string | null
          quantity: string | null
          remarks: string | null
          sent_at: string | null
          sent_by_user_id: string | null
          shipping_association: number | null
          status: Database["public"]["Enums"]["pda_status"]
          tenant_id: string
          terminal: string | null
          to_client_id: string | null
          to_display_name: string | null
          to_location: string | null
          towage_in: number | null
          updated_at: string
          vessel_name: string | null
          waterway: number | null
        }
        Insert: {
          agency_fee?: number | null
          beam?: string | null
          berth?: string | null
          cargo?: string | null
          clearance?: number | null
          comments?: Json | null
          created_at?: string
          created_by?: string | null
          date_field?: string | null
          days_alongside?: string | null
          dockage?: number | null
          draft?: string | null
          dwt?: string | null
          exchange_rate?: string | null
          exchange_rate_source?: string | null
          exchange_rate_source_url?: string | null
          exchange_rate_timestamp?: string | null
          free_pratique?: number | null
          from_location?: string | null
          id?: string
          immigration?: number | null
          imo_number?: string | null
          launch_boat?: number | null
          light_dues?: number | null
          linesman?: number | null
          loa?: string | null
          paperless_port?: number | null
          pda_number: string
          pilotage_in?: number | null
          port_name?: string | null
          quantity?: string | null
          remarks?: string | null
          sent_at?: string | null
          sent_by_user_id?: string | null
          shipping_association?: number | null
          status?: Database["public"]["Enums"]["pda_status"]
          tenant_id: string
          terminal?: string | null
          to_client_id?: string | null
          to_display_name?: string | null
          to_location?: string | null
          towage_in?: number | null
          updated_at?: string
          vessel_name?: string | null
          waterway?: number | null
        }
        Update: {
          agency_fee?: number | null
          beam?: string | null
          berth?: string | null
          cargo?: string | null
          clearance?: number | null
          comments?: Json | null
          created_at?: string
          created_by?: string | null
          date_field?: string | null
          days_alongside?: string | null
          dockage?: number | null
          draft?: string | null
          dwt?: string | null
          exchange_rate?: string | null
          exchange_rate_source?: string | null
          exchange_rate_source_url?: string | null
          exchange_rate_timestamp?: string | null
          free_pratique?: number | null
          from_location?: string | null
          id?: string
          immigration?: number | null
          imo_number?: string | null
          launch_boat?: number | null
          light_dues?: number | null
          linesman?: number | null
          loa?: string | null
          paperless_port?: number | null
          pda_number?: string
          pilotage_in?: number | null
          port_name?: string | null
          quantity?: string | null
          remarks?: string | null
          sent_at?: string | null
          sent_by_user_id?: string | null
          shipping_association?: number | null
          status?: Database["public"]["Enums"]["pda_status"]
          tenant_id?: string
          terminal?: string | null
          to_client_id?: string | null
          to_display_name?: string | null
          to_location?: string | null
          towage_in?: number | null
          updated_at?: string
          vessel_name?: string | null
          waterway?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_pda_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
    }
    Enums: {
      pda_status: "IN_PROGRESS" | "SENT" | "APPROVED"
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
      pda_status: ["IN_PROGRESS", "SENT", "APPROVED"],
    },
  },
} as const
