export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      countries: {
        Row: {
          id: string
          name: string
          flag_icon: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          flag_icon?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          flag_icon?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      currencies: {
        Row: {
          id: string
          code: string
          name: string
          symbol: string
          active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          symbol?: string
          active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          symbol?: string
          active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          id: string
          name: string
          active: boolean | null
          currency_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          active?: boolean | null
          currency_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          active?: boolean | null
          currency_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          }
        ]
      }
      delivery_methods: {
        Row: {
          id: string
          name: string
          active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          payment_method_id: string
          delivery_method_id: string
          rate: number
          updated_at: string | null
        }
        Insert: {
          payment_method_id: string
          delivery_method_id: string
          rate?: number
          updated_at?: string | null
        }
        Update: {
          payment_method_id?: string
          delivery_method_id?: string
          rate?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_v2_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_rates_v2_delivery_method_id_fkey"
            columns: ["delivery_method_id"]
            isOneToOne: false
            referencedRelation: "delivery_methods"
            referencedColumns: ["id"]
          }
        ]
      }
      combos: {
        Row: {
          id: string
          title: string
          description: string | null
          price_usd: number
          image_url: string | null
          available: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          price_usd: number
          image_url?: string | null
          available?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          price_usd?: number
          image_url?: string | null
          available?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mobile_recharges: {
        Row: {
          id: string
          title: string
          description: string | null
          price_usd: number
          image_url: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          price_usd: number
          image_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          price_usd?: number
          image_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: string
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: string
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: string
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      site_settings: {
        Row: {
          key: string
          value: string
          updated_at: string | null
        }
        Insert: {
          key: string
          value: string
          updated_at?: string | null
        }
        Update: {
          key?: string
          value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      handle_new_user: {
        Args: Record<string, never>
        Returns: unknown
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}
