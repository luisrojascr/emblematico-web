
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "billing_events": {
                  Row: {
                    "error": string | null,"event_type": string,"id": string,"payload": NonNullable<Json>,"processed_at": string | null,"provider": string,"provider_event_id": string,"received_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "error"?: string | null,"event_type": string,"id"?: string,"payload": NonNullable<Json>,"processed_at"?: string | null,"provider": string,"provider_event_id": string,"received_at"?: string
                  }
                  Update: {
                    "error"?: string | null,"event_type"?: string,"id"?: string,"payload"?: NonNullable<Json>,"processed_at"?: string | null,"provider"?: string,"provider_event_id"?: string,"received_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"business_members": {
                  Row: {
                    "business_id": string,"created_at": string,"role": Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_members_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"business_orders": {
                  Row: {
                    "business_id": string,"created_at": string,"id": string,"notes": string | null,"product_id": string | null,"product_name": string,"quantity": number,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"id"?: string,"notes"?: string | null,"product_id"?: string | null,"product_name": string,"quantity"?: number,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"id"?: string,"notes"?: string | null,"product_id"?: string | null,"product_name"?: string,"quantity"?: number,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_orders_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "business_orders_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"businesses": {
                  Row: {
                    "category": string | null,"created_at": string,"id": string,"indexable": boolean,"name": string,"service_expires_at": string | null,"service_plan": string | null,"slug": string,"status": Database["public"]['Enums']["business_status"],"suspended_at": string | null,"suspended_reason": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string | null,"created_at"?: string,"id"?: string,"indexable"?: boolean,"name": string,"service_expires_at"?: string | null,"service_plan"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["business_status"],"suspended_at"?: string | null,"suspended_reason"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "category"?: string | null,"created_at"?: string,"id"?: string,"indexable"?: boolean,"name"?: string,"service_expires_at"?: string | null,"service_plan"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["business_status"],"suspended_at"?: string | null,"suspended_reason"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"media": {
                  Row: {
                    "business_id": string,"created_at": string,"id": string,"media_type": Database["public"]['Enums']["media_type"],"mime": string,"size_bytes": number,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"id"?: string,"media_type": Database["public"]['Enums']["media_type"],"mime": string,"size_bytes": number,"storage_path": string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"id"?: string,"media_type"?: Database["public"]['Enums']["media_type"],"mime"?: string,"size_bytes"?: number,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "media_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"pages": {
                  Row: {
                    "business_id": string,"draft_content": NonNullable<Json>,"id": string,"published_at": string | null,"published_content": Json | null,"status": Database["public"]['Enums']["page_status"],"template_key": Database["public"]['Enums']["template_key"],"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"draft_content"?: NonNullable<Json>,"id"?: string,"published_at"?: string | null,"published_content"?: Json | null,"status"?: Database["public"]['Enums']["page_status"],"template_key": Database["public"]['Enums']["template_key"],"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "business_id"?: string,"draft_content"?: NonNullable<Json>,"id"?: string,"published_at"?: string | null,"published_content"?: Json | null,"status"?: Database["public"]['Enums']["page_status"],"template_key"?: Database["public"]['Enums']["template_key"],"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "pages_business_id_fkey"
      columns: ["business_id"]
isOneToOne: true
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"product_categories": {
                  Row: {
                    "description": string | null,"id": string,"image_path": string | null,"name": string,"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"id"?: string,"image_path"?: string | null,"name": string,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "description"?: string | null,"id"?: string,"image_path"?: string | null,"name"?: string,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"products": {
                  Row: {
                    "category_id": string,"created_at": string,"description": string | null,"id": string,"images": (string)[],"is_active": boolean,"name": string,"slug": string,"sort_order": number,"summary": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"created_at"?: string,"description"?: string | null,"id"?: string,"images"?: (string)[],"is_active"?: boolean,"name": string,"slug": string,"sort_order"?: number,"summary"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"images"?: (string)[],"is_active"?: boolean,"name"?: string,"slug"?: string,"sort_order"?: number,"summary"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "product_categories"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "country": string | null,"created_at": string,"email": string | null,"email_normalized": string | null,"full_name": string | null,"id": string,"max_properties": number,"role": Database["public"]['Enums']["user_role"],"self_signup": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "country"?: string | null,"created_at"?: string,"email"?: string | null,"email_normalized"?: string | null,"full_name"?: string | null,"id": string,"max_properties"?: number,"role"?: Database["public"]['Enums']["user_role"],"self_signup"?: boolean
                  }
                  Update: {
                    "country"?: string | null,"created_at"?: string,"email"?: string | null,"email_normalized"?: string | null,"full_name"?: string | null,"id"?: string,"max_properties"?: number,"role"?: Database["public"]['Enums']["user_role"],"self_signup"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"qr_codes": {
                  Row: {
                    "business_id": string,"created_at": string,"destination_path": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"destination_path": string,"id"?: string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"destination_path"?: string,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "qr_codes_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"quote_requests": {
                  Row: {
                    "business_type": string | null,"created_at": string,"email": string | null,"id": string,"ip_hash": string | null,"message": string | null,"name": string,"phone": string | null,"product_id": string | null,"status": Database["public"]['Enums']["quote_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "business_type"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"ip_hash"?: string | null,"message"?: string | null,"name": string,"phone"?: string | null,"product_id"?: string | null,"status"?: Database["public"]['Enums']["quote_status"]
                  }
                  Update: {
                    "business_type"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"ip_hash"?: string | null,"message"?: string | null,"name"?: string,"phone"?: string | null,"product_id"?: string | null,"status"?: Database["public"]['Enums']["quote_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "quote_requests_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"slug_history": {
                  Row: {
                    "business_id": string,"retired_at": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"retired_at"?: string,"slug": string
                  }
                  Update: {
                    "business_id"?: string,"retired_at"?: string,"slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "slug_history_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"subscription_notices": {
                  Row: {
                    "kind": string,"period_end": string,"sent_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "kind": string,"period_end": string,"sent_at"?: string,"user_id": string
                  }
                  Update: {
                    "kind"?: string,"period_end"?: string,"sent_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"subscriptions": {
                  Row: {
                    "billing_period": Database["public"]['Enums']["billing_period"] | null,"created_at": string,"current_period_end": string | null,"extra_properties": number,"plan": Database["public"]['Enums']["plan_tier"],"property_limit_override": number | null,"provider": string | null,"provider_customer_id": string | null,"provider_subscription_id": string | null,"status": Database["public"]['Enums']["subscription_status"],"trial_ends_at": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "billing_period"?: Database["public"]['Enums']["billing_period"] | null,"created_at"?: string,"current_period_end"?: string | null,"extra_properties"?: number,"plan"?: Database["public"]['Enums']["plan_tier"],"property_limit_override"?: number | null,"provider"?: string | null,"provider_customer_id"?: string | null,"provider_subscription_id"?: string | null,"status"?: Database["public"]['Enums']["subscription_status"],"trial_ends_at"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "billing_period"?: Database["public"]['Enums']["billing_period"] | null,"created_at"?: string,"current_period_end"?: string | null,"extra_properties"?: number,"plan"?: Database["public"]['Enums']["plan_tier"],"property_limit_override"?: number | null,"provider"?: string | null,"provider_customer_id"?: string | null,"provider_subscription_id"?: string | null,"status"?: Database["public"]['Enums']["subscription_status"],"trial_ends_at"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "business_is_active":
{ Args: { "p_business_id": string }; Returns: boolean
                           },
"business_is_paused_by_plan":
{ Args: { "p_business_id": string }; Returns: boolean
                           },
"business_owner":
{ Args: { "p_business_id": string }; Returns: string
                           },
"create_business":
{ Args: { "p_category": string,"p_content"?: Json,"p_name": string,"p_slug": string,"p_template": Database["public"]['Enums']["template_key"] }; Returns: string
                           },
"create_my_business":
{ Args: { "p_content"?: Json,"p_name": string,"p_slug": string }; Returns: string
                           },
"effective_plan":
{ Args: { "p_user_id": string }; Returns: Database["public"]['Enums']["plan_tier"]
                           },
"expire_subscriptions":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"get_public_page":
{ Args: { "p_slug": string }; Returns: Json
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_member":
{ Args: { "p_business_id": string }; Returns: boolean
                           },
"my_entitlements":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"run_subscription_expiry":
{ Args: Record<PropertyKey, never>; Returns: { "period_end": string,"previous_plan": Database["public"]['Enums']["plan_tier"],"previous_status": Database["public"]['Enums']["subscription_status"],"user_id": string }[]
                           },
"normalize_email":
{ Args: { "p_email": string }; Returns: string
                           },
"property_limit":
{ Args: { "p_user_id": string }; Returns: number
                           },
"publish_page":
{ Args: { "p_business_id": string,"p_expected_updated_at": string }; Returns: Json
                           },
"storage_can_write":
{ Args: { "p_name": string }; Returns: boolean
                           },
"submit_quote_request":
{ Args: { "p_business_type"?: string,"p_email"?: string,"p_ip_hash": string,"p_message"?: string,"p_name": string,"p_phone"?: string,"p_product_id"?: string }; Returns: string
                           },
"trial_days":
{ Args: Record<PropertyKey, never>; Returns: number
                           }
          }
          Enums: {
            "billing_period": "monthly"|"annual","business_status": "active"|"suspended"|"archived","media_type": "logo"|"cover"|"gallery","member_role": "owner"|"editor","page_status": "draft"|"published"|"unpublished","plan_tier": "free"|"essential"|"plus"|"managers","quote_status": "new"|"contacted"|"closed","subscription_status": "trialing"|"active"|"past_due"|"canceled"|"expired","template_key": "hospitality"|"general","user_role": "admin"|"client"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "billing_period": ["monthly", "annual"],"business_status": ["active", "suspended", "archived"],"media_type": ["logo", "cover", "gallery"],"member_role": ["owner", "editor"],"page_status": ["draft", "published", "unpublished"],"plan_tier": ["free", "essential", "plus", "managers"],"quote_status": ["new", "contacted", "closed"],"subscription_status": ["trialing", "active", "past_due", "canceled", "expired"],"template_key": ["hospitality", "general"],"user_role": ["admin", "client"]
          }
        }
} as const
