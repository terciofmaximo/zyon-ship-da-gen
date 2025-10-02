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
      email_verifications: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fda: {
        Row: {
          assigned_user_id: string | null
          client_id: string | null
          client_name: string | null
          client_paid_usd: number | null
          client_share_pct: number | null
          created_at: string
          created_by: string | null
          currency_base: string
          currency_local: string
          eta: string | null
          etb: string | null
          ets: string | null
          exchange_rate: number | null
          fx_source: string | null
          id: string
          imo: string | null
          meta: Json | null
          pda_id: string | null
          port: string | null
          remarks: string | null
          status: Database["public"]["Enums"]["fda_status"]
          tenant_id: string
          terminal: string | null
          updated_at: string
          vessel_name: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          client_id?: string | null
          client_name?: string | null
          client_paid_usd?: number | null
          client_share_pct?: number | null
          created_at?: string
          created_by?: string | null
          currency_base?: string
          currency_local?: string
          eta?: string | null
          etb?: string | null
          ets?: string | null
          exchange_rate?: number | null
          fx_source?: string | null
          id?: string
          imo?: string | null
          meta?: Json | null
          pda_id?: string | null
          port?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["fda_status"]
          tenant_id: string
          terminal?: string | null
          updated_at?: string
          vessel_name?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          client_id?: string | null
          client_name?: string | null
          client_paid_usd?: number | null
          client_share_pct?: number | null
          created_at?: string
          created_by?: string | null
          currency_base?: string
          currency_local?: string
          eta?: string | null
          etb?: string | null
          ets?: string | null
          exchange_rate?: number | null
          fx_source?: string | null
          id?: string
          imo?: string | null
          meta?: Json | null
          pda_id?: string | null
          port?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["fda_status"]
          tenant_id?: string
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
          assigned_to: string | null
          billing_class: string | null
          category: string | null
          client_po: string | null
          cost_center: string | null
          counterparty: string | null
          created_at: string
          custom_fx_rate: number | null
          description: string | null
          details: Json | null
          due_date: string | null
          fda_id: string
          fx_source_url: string | null
          gl_account: string | null
          id: string
          invoice_date: string | null
          invoice_no: string | null
          is_billable: boolean | null
          line_no: number
          markup_pct: number | null
          notes: string | null
          origin: string | null
          paid_to_supplier_usd: number | null
          payment_terms: string | null
          pda_field: string | null
          settled_at: string | null
          side: Database["public"]["Enums"]["fda_ledger_side"]
          source: Json | null
          status: Database["public"]["Enums"]["fda_ledger_status"]
          tenant_id: string
          updated_at: string
          use_custom_fx: boolean | null
          voyage_fixture: string | null
        }
        Insert: {
          amount_local?: number | null
          amount_usd?: number | null
          assigned_to?: string | null
          billing_class?: string | null
          category?: string | null
          client_po?: string | null
          cost_center?: string | null
          counterparty?: string | null
          created_at?: string
          custom_fx_rate?: number | null
          description?: string | null
          details?: Json | null
          due_date?: string | null
          fda_id: string
          fx_source_url?: string | null
          gl_account?: string | null
          id?: string
          invoice_date?: string | null
          invoice_no?: string | null
          is_billable?: boolean | null
          line_no: number
          markup_pct?: number | null
          notes?: string | null
          origin?: string | null
          paid_to_supplier_usd?: number | null
          payment_terms?: string | null
          pda_field?: string | null
          settled_at?: string | null
          side: Database["public"]["Enums"]["fda_ledger_side"]
          source?: Json | null
          status?: Database["public"]["Enums"]["fda_ledger_status"]
          tenant_id: string
          updated_at?: string
          use_custom_fx?: boolean | null
          voyage_fixture?: string | null
        }
        Update: {
          amount_local?: number | null
          amount_usd?: number | null
          assigned_to?: string | null
          billing_class?: string | null
          category?: string | null
          client_po?: string | null
          cost_center?: string | null
          counterparty?: string | null
          created_at?: string
          custom_fx_rate?: number | null
          description?: string | null
          details?: Json | null
          due_date?: string | null
          fda_id?: string
          fx_source_url?: string | null
          gl_account?: string | null
          id?: string
          invoice_date?: string | null
          invoice_no?: string | null
          is_billable?: boolean | null
          line_no?: number
          markup_pct?: number | null
          notes?: string | null
          origin?: string | null
          paid_to_supplier_usd?: number | null
          payment_terms?: string | null
          pda_field?: string | null
          settled_at?: string | null
          side?: Database["public"]["Enums"]["fda_ledger_side"]
          source?: Json | null
          status?: Database["public"]["Enums"]["fda_ledger_status"]
          tenant_id?: string
          updated_at?: string
          use_custom_fx?: boolean | null
          voyage_fixture?: string | null
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
      fda_ledger_attachments: {
        Row: {
          id: string
          ledger_id: string
          tenant_id: string
          type: string
          uploaded_at: string
          uploaded_by: string | null
          url: string
          version: number
        }
        Insert: {
          id?: string
          ledger_id: string
          tenant_id: string
          type: string
          uploaded_at?: string
          uploaded_by?: string | null
          url: string
          version?: number
        }
        Update: {
          id?: string
          ledger_id?: string
          tenant_id?: string
          type?: string
          uploaded_at?: string
          uploaded_by?: string | null
          url?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fda_ledger_attachments_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "fda_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      fda_ledger_comments: {
        Row: {
          comment: string
          created_at: string
          created_by: string
          id: string
          ledger_id: string
          tenant_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          created_by: string
          id?: string
          ledger_id: string
          tenant_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          created_by?: string
          id?: string
          ledger_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      fda_ledger_payments: {
        Row: {
          amount_local: number
          amount_usd: number
          created_at: string
          created_by: string | null
          fx_at_payment: number
          id: string
          ledger_id: string
          method: string
          paid_at: string
          receipt_url: string | null
          reference: string | null
          tenant_id: string
        }
        Insert: {
          amount_local: number
          amount_usd: number
          created_at?: string
          created_by?: string | null
          fx_at_payment: number
          id?: string
          ledger_id: string
          method: string
          paid_at: string
          receipt_url?: string | null
          reference?: string | null
          tenant_id: string
        }
        Update: {
          amount_local?: number
          amount_usd?: number
          created_at?: string
          created_by?: string | null
          fx_at_payment?: number
          id?: string
          ledger_id?: string
          method?: string
          paid_at?: string
          receipt_url?: string | null
          reference?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fda_ledger_payments_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "fda_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["invitation_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          role?: Database["public"]["Enums"]["invitation_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["invitation_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["membership_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          org_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          org_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          org_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_domains_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          org_id: string
          role: string
          token: string
          used_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          org_id: string
          role?: string
          token: string
          used_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          role?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          cnpj: string | null
          company_type: Database["public"]["Enums"]["company_type"] | null
          created_at: string
          created_from_signup: boolean | null
          domain: string | null
          id: string
          name: string
          owner_user_id: string | null
          primary_domain: string | null
          slug: string
        }
        Insert: {
          cnpj?: string | null
          company_type?: Database["public"]["Enums"]["company_type"] | null
          created_at?: string
          created_from_signup?: boolean | null
          domain?: string | null
          id?: string
          name: string
          owner_user_id?: string | null
          primary_domain?: string | null
          slug: string
        }
        Update: {
          cnpj?: string | null
          company_type?: Database["public"]["Enums"]["company_type"] | null
          created_at?: string
          created_from_signup?: boolean | null
          domain?: string | null
          id?: string
          name?: string
          owner_user_id?: string | null
          primary_domain?: string | null
          slug?: string
        }
        Relationships: []
      }
      pda_creation_attempts: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          session_id?: string
        }
        Relationships: []
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
          created_by_session_id: string | null
          custom_lines: Json | null
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
          tenant_id: string | null
          terminal: string | null
          to_client_id: string | null
          to_display_name: string | null
          to_location: string | null
          towage_in: number | null
          tracking_id: string | null
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
          created_by_session_id?: string | null
          custom_lines?: Json | null
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
          tenant_id?: string | null
          terminal?: string | null
          to_client_id?: string | null
          to_display_name?: string | null
          to_location?: string | null
          towage_in?: number | null
          tracking_id?: string | null
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
          created_by_session_id?: string | null
          custom_lines?: Json | null
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
          tenant_id?: string | null
          terminal?: string | null
          to_client_id?: string | null
          to_display_name?: string | null
          to_location?: string | null
          towage_in?: number | null
          tracking_id?: string | null
          updated_at?: string
          vessel_name?: string | null
          waterway?: number | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          must_reset_password: boolean | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          must_reset_password?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          must_reset_password?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      auto_associate_organization_by_domain: {
        Args: {
          p_cnpj: string
          p_company_name: string
          p_company_type: Database["public"]["Enums"]["company_type"]
          p_email: string
          p_session_id?: string
          p_user_id: string
        }
        Returns: string
      }
      check_pda_rate_limit: {
        Args: {
          p_ip_address?: string
          p_max_requests?: number
          p_session_id: string
          p_time_window_hours?: number
        }
        Returns: Json
      }
      convert_pda_to_fda: {
        Args: { p_pda_id: string }
        Returns: string
      }
      extract_slug_from_domain: {
        Args: { p_domain: string }
        Returns: string
      }
      generate_pda_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_primary_domain: {
        Args: { org_slug: string }
        Returns: string
      }
      generate_tracking_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_pda_by_tracking_id: {
        Args: { p_tracking_id: string }
        Returns: {
          agency_fee: number | null
          beam: string | null
          berth: string | null
          berths: Json | null
          cargo: string | null
          clearance: number | null
          comments: Json | null
          created_at: string
          created_by: string | null
          created_by_session_id: string | null
          custom_lines: Json | null
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
          tenant_id: string | null
          terminal: string | null
          to_client_id: string | null
          to_display_name: string | null
          to_location: string | null
          towage_in: number | null
          tracking_id: string | null
          updated_at: string
          vessel_name: string | null
          waterway: number | null
        }[]
      }
      get_pdas_by_session: {
        Args: { p_session_id: string }
        Returns: {
          agency_fee: number | null
          beam: string | null
          berth: string | null
          berths: Json | null
          cargo: string | null
          clearance: number | null
          comments: Json | null
          created_at: string
          created_by: string | null
          created_by_session_id: string | null
          custom_lines: Json | null
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
          tenant_id: string | null
          terminal: string | null
          to_client_id: string | null
          to_display_name: string | null
          to_location: string | null
          towage_in: number | null
          tracking_id: string | null
          updated_at: string
          vessel_name: string | null
          waterway: number | null
        }[]
      }
      get_tenant_by_hostname: {
        Args: { hostname: string }
        Returns: {
          id: string
          name: string
          owner_user_id: string
          primary_domain: string
          slug: string
        }[]
      }
      get_tenant_by_slug: {
        Args: { tenant_slug: string }
        Returns: {
          id: string
          name: string
          owner_user_id: string
          slug: string
        }[]
      }
      get_user_org_ids: {
        Args: { _user_id: string }
        Returns: {
          org_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      link_pda_to_new_org: {
        Args: { p_org_id: string; p_pda_id: string }
        Returns: undefined
      }
      setup_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      setup_demo_admin: {
        Args: { admin_email: string; admin_password: string }
        Returns: Json
      }
      sync_fda_from_pda: {
        Args: { p_fda_id: string }
        Returns: number
      }
      validate_invite_token: {
        Args: { invite_token: string }
        Returns: {
          accepted_at: string
          email: string
          expires_at: string
          id: string
          org_id: string
          org_name: string
          role: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "platformAdmin"
      company_type: "Armador" | "Agente" | "Broker"
      fda_ledger_side: "AP" | "AR"
      fda_ledger_status: "Open" | "Settled" | "Partially Settled"
      fda_status: "Draft" | "Posted" | "Closed"
      invitation_role: "admin" | "member" | "viewer"
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      membership_role: "owner" | "admin" | "member" | "viewer"
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
      company_type: ["Armador", "Agente", "Broker"],
      fda_ledger_side: ["AP", "AR"],
      fda_ledger_status: ["Open", "Settled", "Partially Settled"],
      fda_status: ["Draft", "Posted", "Closed"],
      invitation_role: ["admin", "member", "viewer"],
      invitation_status: ["pending", "accepted", "expired", "revoked"],
      membership_role: ["owner", "admin", "member", "viewer"],
      pda_status: ["IN_PROGRESS", "SENT", "APPROVED", "CREATED"],
    },
  },
} as const
