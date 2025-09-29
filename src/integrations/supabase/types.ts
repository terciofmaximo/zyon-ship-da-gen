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
      fda: {
        Row: {
          assigned_user_id: string | null
          client_id: string | null
          client_name: string | null
          client_share_pct: number | null
          created_at: string
          created_by: string | null
          currency_base: string
          currency_local: string
          exchange_rate: number | null
          fx_source: string | null
          id: string
          imo: string | null
          meta: Json | null
          pda_id: string
          port: string | null
          status: Database["public"]["Enums"]["fda_status"]
          terminal: string | null
          updated_at: string
          vessel_name: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          client_id?: string | null
          client_name?: string | null
          client_share_pct?: number | null
          created_at?: string
          created_by?: string | null
          currency_base?: string
          currency_local?: string
          exchange_rate?: number | null
          fx_source?: string | null
          id?: string
          imo?: string | null
          meta?: Json | null
          pda_id: string
          port?: string | null
          status?: Database["public"]["Enums"]["fda_status"]
          terminal?: string | null
          updated_at?: string
          vessel_name?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          client_id?: string | null
          client_name?: string | null
          client_share_pct?: number | null
          created_at?: string
          created_by?: string | null
          currency_base?: string
          currency_local?: string
          exchange_rate?: number | null
          fx_source?: string | null
          id?: string
          imo?: string | null
          meta?: Json | null
          pda_id?: string
          port?: string | null
          status?: Database["public"]["Enums"]["fda_status"]
          terminal?: string | null
          updated_at?: string
          vessel_name?: string | null
        }
        Relationships: []
      }
      fda_ledger: {
        Row: {
          amount_local: number | null
          amount_usd: number | null
          category: string | null
          counterparty: string | null
          created_at: string
          description: string | null
          due_date: string | null
          fda_id: string
          id: string
          invoice_no: string | null
          line_no: number
          side: Database["public"]["Enums"]["fda_ledger_side"]
          source: Json | null
          status: Database["public"]["Enums"]["fda_ledger_status"]
          updated_at: string
        }
        Insert: {
          amount_local?: number | null
          amount_usd?: number | null
          category?: string | null
          counterparty?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          fda_id: string
          id?: string
          invoice_no?: string | null
          line_no: number
          side: Database["public"]["Enums"]["fda_ledger_side"]
          source?: Json | null
          status?: Database["public"]["Enums"]["fda_ledger_status"]
          updated_at?: string
        }
        Update: {
          amount_local?: number | null
          amount_usd?: number | null
          category?: string | null
          counterparty?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          fda_id?: string
          id?: string
          invoice_no?: string | null
          line_no?: number
          side?: Database["public"]["Enums"]["fda_ledger_side"]
          source?: Json | null
          status?: Database["public"]["Enums"]["fda_ledger_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fda_ledger_fda_id_fkey"
            columns: ["fda_id"]
            isOneToOne: false
            referencedRelation: "fda"
            referencedColumns: ["id"]
          },
        ]
      }
      pdas: {
        Row: {
          agency_fee: number | null
          beam: string | null
          berth: string | null
          berths: Json | null
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
          berths?: Json | null
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
          berths?: Json | null
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
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
      generate_pda_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      setup_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      setup_demo_admin: {
        Args: { admin_email: string; admin_password: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user" | "platformAdmin"
      fda_ledger_side: "AP" | "AR"
      fda_ledger_status: "Open" | "Settled" | "Partially Settled"
      fda_status: "Draft" | "Posted" | "Closed"
      pda_status: "IN_PROGRESS" | "SENT" | "APPROVED" | "CREATED"
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
      app_role: ["admin", "user", "platformAdmin"],
      fda_ledger_side: ["AP", "AR"],
      fda_ledger_status: ["Open", "Settled", "Partially Settled"],
      fda_status: ["Draft", "Posted", "Closed"],
      pda_status: ["IN_PROGRESS", "SENT", "APPROVED", "CREATED"],
    },
  },
} as const
