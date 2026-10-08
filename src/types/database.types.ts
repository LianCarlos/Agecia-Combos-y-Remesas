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
          currency_code: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          flag_icon?: string | null
          currency_code?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          flag_icon?: string | null
          currency_code?: string | null
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
          type: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          active?: boolean | null
          type?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          active?: boolean | null
          type?: string | null
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
      products: {
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
      wholesale_rates: {
        Row: {
          id: string
          payment_method_id: string
          min_amount: number
          rate: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          payment_method_id: string
          min_amount: number
          rate: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          payment_method_id?: string
          min_amount?: number
          rate?: number
          active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wholesale_rates_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          }
        ]
      }
      accounts: {
        Row: {
          id: string
          name: string
          type: string
          currency_id: string | null
          country_id: string | null
          is_own: boolean
          owner_name: string | null
          owner_fee_percent: number
          account_details: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          currency_id?: string | null
          country_id?: string | null
          is_own?: boolean
          owner_name?: string | null
          owner_fee_percent?: number
          account_details?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          currency_id?: string | null
          country_id?: string | null
          is_own?: boolean
          owner_name?: string | null
          owner_fee_percent?: number
          account_details?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          }
        ]
      }
      delivery_persons: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      conversion_rates: {
        Row: {
          id: string
          from_code: string
          to_code: string
          rate: number
          updated_at: string
        }
        Insert: {
          id?: string
          from_code: string
          to_code: string
          rate: number
          updated_at?: string
        }
        Update: {
          id?: string
          from_code?: string
          to_code?: string
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      commission_configs: {
        Row: {
          id: string
          country_id: string
          role_type: string
          percent: number
          updated_at: string
        }
        Insert: {
          id?: string
          country_id: string
          role_type: string
          percent?: number
          updated_at?: string
        }
        Update: {
          id?: string
          country_id?: string
          role_type?: string
          percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_configs_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          }
        ]
      }
      referrers: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          referral_code: string
          label: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone?: string | null
          referral_code: string
          label?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          referral_code?: string
          label?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          id: string
          referrer_id: string
          referral_code: string
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referral_code: string
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referral_code?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_clicks_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          order_type: string
          sender_name: string | null
          sender_phone: string | null
          sender_country: string | null
          beneficiary_name: string | null
          beneficiary_ci: string | null
          beneficiary_phone: string | null
          beneficiary_address: string | null
          beneficiary_card_number: string | null
          beneficiary_confirmation_phone: string | null
          country_id: string | null
          currency_code: string | null
          payment_method_id: string | null
          delivery_method_id: string | null
          amount_origin: number | null
          amount_usd: number | null
          receiving_amount: number | null
          rate_multiplier: number | null
          referrer_id: string | null
          referral_code: string | null
          status: string
          payload: Json
          whatsapp_sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_type: string
          sender_name?: string | null
          sender_phone?: string | null
          sender_country?: string | null
          beneficiary_name?: string | null
          beneficiary_ci?: string | null
          beneficiary_phone?: string | null
          beneficiary_address?: string | null
          beneficiary_card_number?: string | null
          beneficiary_confirmation_phone?: string | null
          country_id?: string | null
          currency_code?: string | null
          payment_method_id?: string | null
          delivery_method_id?: string | null
          amount_origin?: number | null
          amount_usd?: number | null
          receiving_amount?: number | null
          rate_multiplier?: number | null
          referrer_id?: string | null
          referral_code?: string | null
          status?: string
          payload?: Json
          whatsapp_sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_type?: string
          sender_name?: string | null
          sender_phone?: string | null
          sender_country?: string | null
          beneficiary_name?: string | null
          beneficiary_ci?: string | null
          beneficiary_phone?: string | null
          beneficiary_address?: string | null
          beneficiary_card_number?: string | null
          beneficiary_confirmation_phone?: string | null
          country_id?: string | null
          currency_code?: string | null
          payment_method_id?: string | null
          delivery_method_id?: string | null
          amount_origin?: number | null
          amount_usd?: number | null
          receiving_amount?: number | null
          rate_multiplier?: number | null
          referrer_id?: string | null
          referral_code?: string | null
          status?: string
          payload?: Json
          whatsapp_sent_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_method_id_fkey"
            columns: ["delivery_method_id"]
            isOneToOne: false
            referencedRelation: "delivery_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          kind: string
          item_id: string | null
          title: string
          price_usd: number
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          kind: string
          item_id?: string | null
          title: string
          price_usd: number
          quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          kind?: string
          item_id?: string | null
          title?: string
          price_usd?: number
          quantity?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      remittances: {
        Row: {
          id: string
          order_id: string | null
          reference: string | null
          country_id: string | null
          currency_id: string | null
          payment_method_id: string | null
          account_id: string | null
          delivery_method_id: string | null
          delivery_person_id: string | null
          referrer_id: string | null
          amount_origin: number
          rate_to_usdt: number
          usdt_received: number
          owner_fee_percent: number
          owner_fee_usdt: number
          delivery_currency: string
          rate_usdt_to_delivery: number
          amount_receive: number
          beneficiary_name: string
          beneficiary_phone: string | null
          beneficiary_address: string | null
          status: string
          notes: string | null
          created_by: string | null
          received_at: string | null
          delivered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          reference?: string | null
          country_id?: string | null
          currency_id?: string | null
          payment_method_id?: string | null
          account_id?: string | null
          delivery_method_id?: string | null
          delivery_person_id?: string | null
          referrer_id?: string | null
          amount_origin: number
          rate_to_usdt: number
          usdt_received: number
          owner_fee_percent?: number
          owner_fee_usdt?: number
          delivery_currency?: string
          rate_usdt_to_delivery: number
          amount_receive: number
          beneficiary_name: string
          beneficiary_phone?: string | null
          beneficiary_address?: string | null
          status?: string
          notes?: string | null
          created_by?: string | null
          received_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          reference?: string | null
          country_id?: string | null
          currency_id?: string | null
          payment_method_id?: string | null
          account_id?: string | null
          delivery_method_id?: string | null
          delivery_person_id?: string | null
          referrer_id?: string | null
          amount_origin?: number
          rate_to_usdt?: number
          usdt_received?: number
          owner_fee_percent?: number
          owner_fee_usdt?: number
          delivery_currency?: string
          rate_usdt_to_delivery?: number
          amount_receive?: number
          beneficiary_name?: string
          beneficiary_phone?: string | null
          beneficiary_address?: string | null
          status?: string
          notes?: string | null
          created_by?: string | null
          received_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "remittances_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remittances_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remittances_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remittances_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remittances_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remittances_delivery_method_id_fkey"
            columns: ["delivery_method_id"]
            isOneToOne: false
            referencedRelation: "delivery_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remittances_delivery_person_id_fkey"
            columns: ["delivery_person_id"]
            isOneToOne: false
            referencedRelation: "delivery_persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remittances_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remittances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      remittance_payouts: {
        Row: {
          id: string
          remittance_id: string
          role_type: string
          participant_name: string | null
          percent: number
          amount_usdt: number
          paid: boolean
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          remittance_id: string
          role_type: string
          participant_name?: string | null
          percent: number
          amount_usdt: number
          paid?: boolean
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          remittance_id?: string
          role_type?: string
          participant_name?: string | null
          percent?: number
          amount_usdt?: number
          paid?: boolean
          paid_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "remittance_payouts_remittance_id_fkey"
            columns: ["remittance_id"]
            isOneToOne: false
            referencedRelation: "remittances"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_superadmin: {
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
