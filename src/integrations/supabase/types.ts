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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          business_id: string | null
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          owner_user_id: string | null
          related_id: string | null
          related_type: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          owner_user_id?: string | null
          related_id?: string | null
          related_type?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          owner_user_id?: string | null
          related_id?: string | null
          related_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_business_id: string | null
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_business_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_business_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_business_id_fkey"
            columns: ["actor_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role_in_business: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role_in_business?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role_in_business?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          business_name: string
          business_type: string | null
          contact_email: string | null
          contact_phone: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          industry: string | null
          is_buyer: boolean
          is_carrier: boolean
          is_featured: boolean
          is_supplier: boolean
          location: string | null
          logo_url: string | null
          owner_user_id: string | null
          rating: number | null
          region: string | null
          slug: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          website: string | null
        }
        Insert: {
          business_name: string
          business_type?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_buyer?: boolean
          is_carrier?: boolean
          is_featured?: boolean
          is_supplier?: boolean
          location?: string | null
          logo_url?: string | null
          owner_user_id?: string | null
          rating?: number | null
          region?: string | null
          slug?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Update: {
          business_name?: string
          business_type?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_buyer?: boolean
          is_carrier?: boolean
          is_featured?: boolean
          is_supplier?: boolean
          location?: string | null
          logo_url?: string | null
          owner_user_id?: string | null
          rating?: number | null
          region?: string | null
          slug?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          industry_group: string | null
          name: string
          parent_category_id: string | null
          slug: string | null
          sort_order: number | null
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id?: string
          industry_group?: string | null
          name: string
          parent_category_id?: string | null
          slug?: string | null
          sort_order?: number | null
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          industry_group?: string | null
          name?: string
          parent_category_id?: string | null
          slug?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_business_id: string | null
          carrier_business_id: string | null
          created_at: string
          id: string
          last_message_at: string | null
          related_id: string | null
          related_type: string | null
          supplier_business_id: string | null
          updated_at: string
        }
        Insert: {
          buyer_business_id?: string | null
          carrier_business_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          related_id?: string | null
          related_type?: string | null
          supplier_business_id?: string | null
          updated_at?: string
        }
        Update: {
          buyer_business_id?: string | null
          carrier_business_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          related_id?: string | null
          related_type?: string | null
          supplier_business_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_business_id_fkey"
            columns: ["buyer_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_carrier_business_id_fkey"
            columns: ["carrier_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_supplier_business_id_fkey"
            columns: ["supplier_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_offer_versions: {
        Row: {
          change_summary: string | null
          changed_by_user_id: string | null
          created_at: string
          custom_offer_id: string
          id: string
          offer_snapshot_json: Json | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          custom_offer_id: string
          id?: string
          offer_snapshot_json?: Json | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          custom_offer_id?: string
          id?: string
          offer_snapshot_json?: Json | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_offer_versions_custom_offer_id_fkey"
            columns: ["custom_offer_id"]
            isOneToOne: false
            referencedRelation: "custom_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_offers: {
        Row: {
          attachments: string[] | null
          buyer_business_id: string
          certifications_included: string | null
          contract_duration: string | null
          created_at: string
          custom_request_id: string | null
          delivery_fee: number | null
          delivery_schedule: string | null
          description: string | null
          escrow_available: boolean | null
          id: string
          is_recurring: boolean | null
          lead_time: string | null
          minimum_order_quantity: number | null
          payment_terms: string | null
          platform_fee: number | null
          price_lock_period: string | null
          product_id: string | null
          quantity: number | null
          recurring_schedule: string | null
          status: Database["public"]["Enums"]["custom_offer_status"]
          stock_availability: string | null
          supplier_business_id: string
          supplier_notes: string | null
          title: string
          total_payable: number | null
          total_price: number | null
          unit: string | null
          unit_price: number | null
          updated_at: string
          valid_until: string | null
          vat_amount: number | null
          version_number: number
          warranty_terms: string | null
        }
        Insert: {
          attachments?: string[] | null
          buyer_business_id: string
          certifications_included?: string | null
          contract_duration?: string | null
          created_at?: string
          custom_request_id?: string | null
          delivery_fee?: number | null
          delivery_schedule?: string | null
          description?: string | null
          escrow_available?: boolean | null
          id?: string
          is_recurring?: boolean | null
          lead_time?: string | null
          minimum_order_quantity?: number | null
          payment_terms?: string | null
          platform_fee?: number | null
          price_lock_period?: string | null
          product_id?: string | null
          quantity?: number | null
          recurring_schedule?: string | null
          status?: Database["public"]["Enums"]["custom_offer_status"]
          stock_availability?: string | null
          supplier_business_id: string
          supplier_notes?: string | null
          title: string
          total_payable?: number | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
          valid_until?: string | null
          vat_amount?: number | null
          version_number?: number
          warranty_terms?: string | null
        }
        Update: {
          attachments?: string[] | null
          buyer_business_id?: string
          certifications_included?: string | null
          contract_duration?: string | null
          created_at?: string
          custom_request_id?: string | null
          delivery_fee?: number | null
          delivery_schedule?: string | null
          description?: string | null
          escrow_available?: boolean | null
          id?: string
          is_recurring?: boolean | null
          lead_time?: string | null
          minimum_order_quantity?: number | null
          payment_terms?: string | null
          platform_fee?: number | null
          price_lock_period?: string | null
          product_id?: string | null
          quantity?: number | null
          recurring_schedule?: string | null
          status?: Database["public"]["Enums"]["custom_offer_status"]
          stock_availability?: string | null
          supplier_business_id?: string
          supplier_notes?: string | null
          title?: string
          total_payable?: number | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
          valid_until?: string | null
          vat_amount?: number | null
          version_number?: number
          warranty_terms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_offers_buyer_business_id_fkey"
            columns: ["buyer_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_offers_custom_request_id_fkey"
            columns: ["custom_request_id"]
            isOneToOne: false
            referencedRelation: "custom_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_offers_supplier_business_id_fkey"
            columns: ["supplier_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_requests: {
        Row: {
          attachments: string[] | null
          buyer_business_id: string
          category_id: string | null
          certification_requirements: string | null
          created_at: string
          custom_requirements: string | null
          delivery_location: string | null
          delivery_requirements: string | null
          id: string
          message: string | null
          needed_by: string | null
          packaging_requirements: string | null
          product_id: string | null
          product_needed: string | null
          quantity: number | null
          recurring_type: string | null
          status: Database["public"]["Enums"]["custom_request_status"]
          supplier_business_id: string
          target_budget: number | null
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          buyer_business_id: string
          category_id?: string | null
          certification_requirements?: string | null
          created_at?: string
          custom_requirements?: string | null
          delivery_location?: string | null
          delivery_requirements?: string | null
          id?: string
          message?: string | null
          needed_by?: string | null
          packaging_requirements?: string | null
          product_id?: string | null
          product_needed?: string | null
          quantity?: number | null
          recurring_type?: string | null
          status?: Database["public"]["Enums"]["custom_request_status"]
          supplier_business_id: string
          target_budget?: number | null
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          buyer_business_id?: string
          category_id?: string | null
          certification_requirements?: string | null
          created_at?: string
          custom_requirements?: string | null
          delivery_location?: string | null
          delivery_requirements?: string | null
          id?: string
          message?: string | null
          needed_by?: string | null
          packaging_requirements?: string | null
          product_id?: string | null
          product_needed?: string | null
          quantity?: number | null
          recurring_type?: string | null
          status?: Database["public"]["Enums"]["custom_request_status"]
          supplier_business_id?: string
          target_budget?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_requests_buyer_business_id_fkey"
            columns: ["buyer_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_requests_supplier_business_id_fkey"
            columns: ["supplier_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          amount: number
          buyer_business_id: string
          created_at: string
          disputed_at: string | null
          escrow_status: Database["public"]["Enums"]["escrow_status"]
          funded_at: string | null
          id: string
          order_id: string
          platform_fee: number | null
          release_condition: string | null
          released_at: string | null
          supplier_business_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          buyer_business_id: string
          created_at?: string
          disputed_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          funded_at?: string | null
          id?: string
          order_id: string
          platform_fee?: number | null
          release_condition?: string | null
          released_at?: string | null
          supplier_business_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_business_id?: string
          created_at?: string
          disputed_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          funded_at?: string | null
          id?: string
          order_id?: string
          platform_fee?: number | null
          release_condition?: string | null
          released_at?: string | null
          supplier_business_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_buyer_business_id_fkey"
            columns: ["buyer_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_supplier_business_id_fkey"
            columns: ["supplier_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_quotes: {
        Row: {
          carrier_business_id: string
          created_at: string
          driver_notes: string | null
          estimated_delivery_time: string | null
          id: string
          includes_insurance: boolean | null
          includes_loading: boolean | null
          logistics_request_id: string
          pickup_availability: string | null
          status: string | null
          total_price: number | null
          updated_at: string
          vehicle_offered: string | null
        }
        Insert: {
          carrier_business_id: string
          created_at?: string
          driver_notes?: string | null
          estimated_delivery_time?: string | null
          id?: string
          includes_insurance?: boolean | null
          includes_loading?: boolean | null
          logistics_request_id: string
          pickup_availability?: string | null
          status?: string | null
          total_price?: number | null
          updated_at?: string
          vehicle_offered?: string | null
        }
        Update: {
          carrier_business_id?: string
          created_at?: string
          driver_notes?: string | null
          estimated_delivery_time?: string | null
          id?: string
          includes_insurance?: boolean | null
          includes_loading?: boolean | null
          logistics_request_id?: string
          pickup_availability?: string | null
          status?: string | null
          total_price?: number | null
          updated_at?: string
          vehicle_offered?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_quotes_carrier_business_id_fkey"
            columns: ["carrier_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_quotes_logistics_request_id_fkey"
            columns: ["logistics_request_id"]
            isOneToOne: false
            referencedRelation: "logistics_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_requests: {
        Row: {
          buyer_business_id: string | null
          cargo_description: string | null
          cargo_type: string | null
          created_at: string
          delivery_deadline: string | null
          dropoff_address: string | null
          dropoff_contact_name: string | null
          dropoff_contact_phone: string | null
          gps_tracking_required: boolean | null
          id: string
          insurance_required: boolean | null
          item_count: number | null
          order_id: string | null
          pickup_address: string | null
          pickup_contact_name: string | null
          pickup_contact_phone: string | null
          pickup_date: string | null
          pickup_time: string | null
          shipper_business_id: string | null
          special_requirements: string | null
          status: Database["public"]["Enums"]["logistics_status"]
          target_budget: number | null
          title: string | null
          updated_at: string
          vehicle_type: string | null
          volume: number | null
          weight: number | null
        }
        Insert: {
          buyer_business_id?: string | null
          cargo_description?: string | null
          cargo_type?: string | null
          created_at?: string
          delivery_deadline?: string | null
          dropoff_address?: string | null
          dropoff_contact_name?: string | null
          dropoff_contact_phone?: string | null
          gps_tracking_required?: boolean | null
          id?: string
          insurance_required?: boolean | null
          item_count?: number | null
          order_id?: string | null
          pickup_address?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: string | null
          pickup_date?: string | null
          pickup_time?: string | null
          shipper_business_id?: string | null
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["logistics_status"]
          target_budget?: number | null
          title?: string | null
          updated_at?: string
          vehicle_type?: string | null
          volume?: number | null
          weight?: number | null
        }
        Update: {
          buyer_business_id?: string | null
          cargo_description?: string | null
          cargo_type?: string | null
          created_at?: string
          delivery_deadline?: string | null
          dropoff_address?: string | null
          dropoff_contact_name?: string | null
          dropoff_contact_phone?: string | null
          gps_tracking_required?: boolean | null
          id?: string
          insurance_required?: boolean | null
          item_count?: number | null
          order_id?: string | null
          pickup_address?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: string | null
          pickup_date?: string | null
          pickup_time?: string | null
          shipper_business_id?: string | null
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["logistics_status"]
          target_budget?: number | null
          title?: string | null
          updated_at?: string
          vehicle_type?: string | null
          volume?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_requests_buyer_business_id_fkey"
            columns: ["buyer_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_requests_shipper_business_id_fkey"
            columns: ["shipper_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_urls: string[] | null
          conversation_id: string
          created_at: string
          id: string
          message_body: string | null
          message_type: Database["public"]["Enums"]["message_type"]
          related_offer_id: string | null
          related_order_id: string | null
          sender_business_id: string | null
          sender_user_id: string | null
        }
        Insert: {
          attachment_urls?: string[] | null
          conversation_id: string
          created_at?: string
          id?: string
          message_body?: string | null
          message_type?: Database["public"]["Enums"]["message_type"]
          related_offer_id?: string | null
          related_order_id?: string | null
          sender_business_id?: string | null
          sender_user_id?: string | null
        }
        Update: {
          attachment_urls?: string[] | null
          conversation_id?: string
          created_at?: string
          id?: string
          message_body?: string | null
          message_type?: Database["public"]["Enums"]["message_type"]
          related_offer_id?: string | null
          related_order_id?: string | null
          sender_business_id?: string | null
          sender_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_related_offer_id_fkey"
            columns: ["related_offer_id"]
            isOneToOne: false
            referencedRelation: "custom_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_business_id_fkey"
            columns: ["sender_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          business_id: string | null
          created_at: string
          id: string
          is_read: boolean
          related_id: string | null
          related_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          body?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          related_type?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          body?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          quantity: number | null
          title: string | null
          total_price: number | null
          unit: string | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          quantity?: number | null
          title?: string | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          quantity?: number | null
          title?: string | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_business_id: string
          created_at: string
          delivery_date: string | null
          delivery_fee: number | null
          delivery_location: string | null
          escrow_status: Database["public"]["Enums"]["escrow_status"]
          fulfillment_status: Database["public"]["Enums"]["fulfillment_status"]
          id: string
          order_number: string | null
          order_status: Database["public"]["Enums"]["order_status"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          platform_fee: number | null
          source_id: string | null
          source_type: Database["public"]["Enums"]["order_source_type"]
          subtotal: number | null
          supplier_business_id: string
          tax_amount: number | null
          title: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          buyer_business_id: string
          created_at?: string
          delivery_date?: string | null
          delivery_fee?: number | null
          delivery_location?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          fulfillment_status?: Database["public"]["Enums"]["fulfillment_status"]
          id?: string
          order_number?: string | null
          order_status?: Database["public"]["Enums"]["order_status"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          platform_fee?: number | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["order_source_type"]
          subtotal?: number | null
          supplier_business_id: string
          tax_amount?: number | null
          title?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          buyer_business_id?: string
          created_at?: string
          delivery_date?: string | null
          delivery_fee?: number | null
          delivery_location?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          fulfillment_status?: Database["public"]["Enums"]["fulfillment_status"]
          id?: string
          order_number?: string | null
          order_status?: Database["public"]["Enums"]["order_status"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          platform_fee?: number | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["order_source_type"]
          subtotal?: number | null
          supplier_business_id?: string
          tax_amount?: number | null
          title?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_business_id_fkey"
            columns: ["buyer_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_business_id_fkey"
            columns: ["supplier_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          fixed_price: number | null
          id: string
          images: string[] | null
          is_active: boolean
          is_featured: boolean
          lead_time: string | null
          location: string | null
          minimum_order_quantity: number | null
          price_max: number | null
          price_min: number | null
          rating: number | null
          region: string | null
          slug: string | null
          stock_status: Database["public"]["Enums"]["product_stock_status"]
          supplier_business_id: string
          title: string
          total_orders: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          fixed_price?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          lead_time?: string | null
          location?: string | null
          minimum_order_quantity?: number | null
          price_max?: number | null
          price_min?: number | null
          rating?: number | null
          region?: string | null
          slug?: string | null
          stock_status?: Database["public"]["Enums"]["product_stock_status"]
          supplier_business_id: string
          title: string
          total_orders?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          fixed_price?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          lead_time?: string | null
          location?: string | null
          minimum_order_quantity?: number | null
          price_max?: number | null
          price_min?: number | null
          rating?: number | null
          region?: string | null
          slug?: string | null
          stock_status?: Database["public"]["Enums"]["product_stock_status"]
          supplier_business_id?: string
          title?: string
          total_orders?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_business_id_fkey"
            columns: ["supplier_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          rating: number
          review_text: string | null
          reviewed_business_id: string
          reviewer_business_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          rating: number
          review_text?: string | null
          reviewed_business_id: string
          reviewer_business_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          rating?: number
          review_text?: string | null
          reviewed_business_id?: string
          reviewer_business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_business_id_fkey"
            columns: ["reviewed_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_business_id_fkey"
            columns: ["reviewer_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_quotes: {
        Row: {
          attachments: string[] | null
          created_at: string
          delivery_fee: number | null
          id: string
          lead_time: string | null
          message: string | null
          minimum_order_quantity: number | null
          payment_terms: string | null
          rfq_id: string
          status: Database["public"]["Enums"]["rfq_quote_status"]
          stock_availability: string | null
          supplier_business_id: string
          total_price: number | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string
          delivery_fee?: number | null
          id?: string
          lead_time?: string | null
          message?: string | null
          minimum_order_quantity?: number | null
          payment_terms?: string | null
          rfq_id: string
          status?: Database["public"]["Enums"]["rfq_quote_status"]
          stock_availability?: string | null
          supplier_business_id: string
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          created_at?: string
          delivery_fee?: number | null
          id?: string
          lead_time?: string | null
          message?: string | null
          minimum_order_quantity?: number | null
          payment_terms?: string | null
          rfq_id?: string
          status?: Database["public"]["Enums"]["rfq_quote_status"]
          stock_availability?: string | null
          supplier_business_id?: string
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_quotes_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_quotes_supplier_business_id_fkey"
            columns: ["supplier_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          buyer_business_id: string
          category_id: string | null
          created_at: string
          delivery_location: string | null
          description: string | null
          id: string
          needed_by: string | null
          product_needed: string | null
          quantity: number | null
          quotes_count: number
          recurring_type: string | null
          region: string | null
          requirements: string | null
          status: Database["public"]["Enums"]["rfq_status"]
          target_budget: number | null
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          buyer_business_id: string
          category_id?: string | null
          created_at?: string
          delivery_location?: string | null
          description?: string | null
          id?: string
          needed_by?: string | null
          product_needed?: string | null
          quantity?: number | null
          quotes_count?: number
          recurring_type?: string | null
          region?: string | null
          requirements?: string | null
          status?: Database["public"]["Enums"]["rfq_status"]
          target_budget?: number | null
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          buyer_business_id?: string
          category_id?: string | null
          created_at?: string
          delivery_location?: string | null
          description?: string | null
          id?: string
          needed_by?: string | null
          product_needed?: string | null
          quantity?: number | null
          quotes_count?: number
          recurring_type?: string | null
          region?: string | null
          requirements?: string | null
          status?: Database["public"]["Enums"]["rfq_status"]
          target_budget?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_buyer_business_id_fkey"
            columns: ["buyer_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_events: {
        Row: {
          created_at: string
          event_label: string | null
          event_type: Database["public"]["Enums"]["shipment_event_type"]
          id: string
          location: string | null
          notes: string | null
          shipment_id: string
        }
        Insert: {
          created_at?: string
          event_label?: string | null
          event_type: Database["public"]["Enums"]["shipment_event_type"]
          id?: string
          location?: string | null
          notes?: string | null
          shipment_id: string
        }
        Update: {
          created_at?: string
          event_label?: string | null
          event_type?: Database["public"]["Enums"]["shipment_event_type"]
          id?: string
          location?: string | null
          notes?: string | null
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier_business_id: string | null
          created_at: string
          current_location: string | null
          current_status: string | null
          driver_name: string | null
          driver_phone: string | null
          eta: string | null
          id: string
          logistics_request_id: string | null
          order_id: string | null
          plate_number: string | null
          proof_of_delivery_url: string | null
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          carrier_business_id?: string | null
          created_at?: string
          current_location?: string | null
          current_status?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          eta?: string | null
          id?: string
          logistics_request_id?: string | null
          order_id?: string | null
          plate_number?: string | null
          proof_of_delivery_url?: string | null
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          carrier_business_id?: string | null
          created_at?: string
          current_location?: string | null
          current_status?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          eta?: string | null
          id?: string
          logistics_request_id?: string | null
          order_id?: string | null
          plate_number?: string | null
          proof_of_delivery_url?: string | null
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_carrier_business_id_fkey"
            columns: ["carrier_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_logistics_request_id_fkey"
            columns: ["logistics_request_id"]
            isOneToOne: false
            referencedRelation: "logistics_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_profiles: {
        Row: {
          business_id: string
          completed_orders: number | null
          created_at: string
          documents_verified: boolean | null
          id: string
          is_gold_supplier: boolean | null
          rating: number | null
          response_time: string | null
          service_regions: string[] | null
          supplier_type: string | null
          updated_at: string
          verification_badges: string[] | null
          years_operating: number | null
        }
        Insert: {
          business_id: string
          completed_orders?: number | null
          created_at?: string
          documents_verified?: boolean | null
          id?: string
          is_gold_supplier?: boolean | null
          rating?: number | null
          response_time?: string | null
          service_regions?: string[] | null
          supplier_type?: string | null
          updated_at?: string
          verification_badges?: string[] | null
          years_operating?: number | null
        }
        Update: {
          business_id?: string
          completed_orders?: number | null
          created_at?: string
          documents_verified?: boolean | null
          id?: string
          is_gold_supplier?: boolean | null
          rating?: number | null
          response_time?: string | null
          service_regions?: string[] | null
          supplier_type?: string | null
          updated_at?: string
          verification_badges?: string[] | null
          years_operating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_documents: {
        Row: {
          business_id: string
          created_at: string
          document_type: string
          file_url: string | null
          id: string
          reviewed_at: string | null
          reviewed_by_admin_id: string | null
          status: Database["public"]["Enums"]["verification_doc_status"]
        }
        Insert: {
          business_id: string
          created_at?: string
          document_type: string
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by_admin_id?: string | null
          status?: Database["public"]["Enums"]["verification_doc_status"]
        }
        Update: {
          business_id?: string
          created_at?: string
          document_type?: string
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by_admin_id?: string | null
          status?: Database["public"]["Enums"]["verification_doc_status"]
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      business_contact_info: {
        Args: { _business_id: string }
        Returns: {
          contact_email: string
          contact_phone: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_business_member: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      user_business_ids: { Args: { _user_id: string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "buyer" | "supplier" | "carrier" | "user"
      custom_offer_status:
        | "pending_review"
        | "accepted"
        | "changes_requested"
        | "rejected"
        | "expired"
        | "converted_to_order"
      custom_request_status:
        | "new_request"
        | "waiting_for_supplier_offer"
        | "custom_offer_sent"
        | "buyer_requested_changes"
        | "accepted"
        | "rejected"
        | "converted_to_order"
        | "expired"
      escrow_status:
        | "not_started"
        | "awaiting_payment"
        | "funded"
        | "held"
        | "released"
        | "disputed"
        | "refunded"
        | "cancelled"
      fulfillment_status:
        | "not_started"
        | "preparing"
        | "ready_for_pickup"
        | "in_transit"
        | "delivered"
        | "completed"
      logistics_status:
        | "draft"
        | "open_for_quotes"
        | "receiving_quotes"
        | "carrier_selected"
        | "pickup_scheduled"
        | "in_transit"
        | "delivered"
        | "completed"
        | "cancelled"
        | "disputed"
      message_type:
        | "text"
        | "custom_offer_card"
        | "rfq_quote_card"
        | "logistics_quote_card"
        | "order_update"
        | "system_notification"
      notification_type:
        | "rfq"
        | "quote"
        | "offer"
        | "order"
        | "escrow"
        | "shipment"
        | "message"
        | "verification"
        | "system"
      order_source_type:
        | "product_checkout"
        | "rfq_quote"
        | "custom_offer"
        | "logistics_booking"
      order_status:
        | "order_created"
        | "awaiting_payment"
        | "escrow_funded"
        | "supplier_preparing"
        | "ready_for_pickup"
        | "in_transit"
        | "delivered"
        | "completed"
        | "disputed"
        | "cancelled"
      payment_status: "unpaid" | "paid_demo" | "refunded"
      product_stock_status:
        | "in_stock"
        | "low_stock"
        | "out_of_stock"
        | "made_to_order"
      rfq_quote_status:
        | "submitted"
        | "shortlisted"
        | "rejected"
        | "accepted"
        | "revised"
        | "expired"
      rfq_status:
        | "draft"
        | "open"
        | "receiving_quotes"
        | "awaiting_decision"
        | "supplier_selected"
        | "order_created"
        | "completed"
        | "closed"
        | "expired"
      shipment_event_type:
        | "booking_confirmed"
        | "driver_assigned"
        | "arrived_at_pickup"
        | "cargo_loaded"
        | "in_transit"
        | "arrived_at_dropoff"
        | "delivered"
        | "buyer_confirmed"
      verification_doc_status: "pending" | "approved" | "rejected"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
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
      app_role: ["admin", "buyer", "supplier", "carrier", "user"],
      custom_offer_status: [
        "pending_review",
        "accepted",
        "changes_requested",
        "rejected",
        "expired",
        "converted_to_order",
      ],
      custom_request_status: [
        "new_request",
        "waiting_for_supplier_offer",
        "custom_offer_sent",
        "buyer_requested_changes",
        "accepted",
        "rejected",
        "converted_to_order",
        "expired",
      ],
      escrow_status: [
        "not_started",
        "awaiting_payment",
        "funded",
        "held",
        "released",
        "disputed",
        "refunded",
        "cancelled",
      ],
      fulfillment_status: [
        "not_started",
        "preparing",
        "ready_for_pickup",
        "in_transit",
        "delivered",
        "completed",
      ],
      logistics_status: [
        "draft",
        "open_for_quotes",
        "receiving_quotes",
        "carrier_selected",
        "pickup_scheduled",
        "in_transit",
        "delivered",
        "completed",
        "cancelled",
        "disputed",
      ],
      message_type: [
        "text",
        "custom_offer_card",
        "rfq_quote_card",
        "logistics_quote_card",
        "order_update",
        "system_notification",
      ],
      notification_type: [
        "rfq",
        "quote",
        "offer",
        "order",
        "escrow",
        "shipment",
        "message",
        "verification",
        "system",
      ],
      order_source_type: [
        "product_checkout",
        "rfq_quote",
        "custom_offer",
        "logistics_booking",
      ],
      order_status: [
        "order_created",
        "awaiting_payment",
        "escrow_funded",
        "supplier_preparing",
        "ready_for_pickup",
        "in_transit",
        "delivered",
        "completed",
        "disputed",
        "cancelled",
      ],
      payment_status: ["unpaid", "paid_demo", "refunded"],
      product_stock_status: [
        "in_stock",
        "low_stock",
        "out_of_stock",
        "made_to_order",
      ],
      rfq_quote_status: [
        "submitted",
        "shortlisted",
        "rejected",
        "accepted",
        "revised",
        "expired",
      ],
      rfq_status: [
        "draft",
        "open",
        "receiving_quotes",
        "awaiting_decision",
        "supplier_selected",
        "order_created",
        "completed",
        "closed",
        "expired",
      ],
      shipment_event_type: [
        "booking_confirmed",
        "driver_assigned",
        "arrived_at_pickup",
        "cargo_loaded",
        "in_transit",
        "arrived_at_dropoff",
        "delivered",
        "buyer_confirmed",
      ],
      verification_doc_status: ["pending", "approved", "rejected"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
