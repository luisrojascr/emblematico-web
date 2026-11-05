export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      business_members: {
        Row: {
          business_id: string;
          created_at: string;
          role: Database["public"]["Enums"]["member_role"];
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          role?: Database["public"]["Enums"]["member_role"];
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          role?: Database["public"]["Enums"]["member_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          category: string | null;
          created_at: string;
          id: string;
          indexable: boolean;
          name: string;
          service_expires_at: string | null;
          service_plan: string | null;
          slug: string;
          status: Database["public"]["Enums"]["business_status"];
          updated_at: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          id?: string;
          indexable?: boolean;
          name: string;
          service_expires_at?: string | null;
          service_plan?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["business_status"];
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          id?: string;
          indexable?: boolean;
          name?: string;
          service_expires_at?: string | null;
          service_plan?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["business_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      media: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          media_type: Database["public"]["Enums"]["media_type"];
          mime: string;
          size_bytes: number;
          storage_path: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          media_type: Database["public"]["Enums"]["media_type"];
          mime: string;
          size_bytes: number;
          storage_path: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          media_type?: Database["public"]["Enums"]["media_type"];
          mime?: string;
          size_bytes?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      pages: {
        Row: {
          business_id: string;
          draft_content: Json;
          id: string;
          published_at: string | null;
          published_content: Json | null;
          status: Database["public"]["Enums"]["page_status"];
          template_key: Database["public"]["Enums"]["template_key"];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          business_id: string;
          draft_content?: Json;
          id?: string;
          published_at?: string | null;
          published_content?: Json | null;
          status?: Database["public"]["Enums"]["page_status"];
          template_key: Database["public"]["Enums"]["template_key"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          business_id?: string;
          draft_content?: Json;
          id?: string;
          published_at?: string | null;
          published_content?: Json | null;
          status?: Database["public"]["Enums"]["page_status"];
          template_key?: Database["public"]["Enums"]["template_key"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pages_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: true;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      product_categories: {
        Row: {
          description: string | null;
          id: string;
          image_path: string | null;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          description?: string | null;
          id?: string;
          image_path?: string | null;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          description?: string | null;
          id?: string;
          image_path?: string | null;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      products: {
        Row: {
          category_id: string;
          created_at: string;
          description: string | null;
          id: string;
          images: string[];
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
          summary: string | null;
          updated_at: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: string[];
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
          summary?: string | null;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: string[];
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
          summary?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Relationships: [];
      };
      qr_codes: {
        Row: {
          business_id: string;
          created_at: string;
          destination_path: string;
          id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          destination_path: string;
          id?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          destination_path?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qr_codes_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      quote_requests: {
        Row: {
          business_type: string | null;
          created_at: string;
          email: string | null;
          id: string;
          ip_hash: string | null;
          message: string | null;
          name: string;
          phone: string | null;
          product_id: string | null;
          status: Database["public"]["Enums"]["quote_status"];
        };
        Insert: {
          business_type?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          ip_hash?: string | null;
          message?: string | null;
          name: string;
          phone?: string | null;
          product_id?: string | null;
          status?: Database["public"]["Enums"]["quote_status"];
        };
        Update: {
          business_type?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          ip_hash?: string | null;
          message?: string | null;
          name?: string;
          phone?: string | null;
          product_id?: string | null;
          status?: Database["public"]["Enums"]["quote_status"];
        };
        Relationships: [
          {
            foreignKeyName: "quote_requests_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      slug_history: {
        Row: {
          business_id: string;
          retired_at: string;
          slug: string;
        };
        Insert: {
          business_id: string;
          retired_at?: string;
          slug: string;
        };
        Update: {
          business_id?: string;
          retired_at?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "slug_history_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      business_is_active: { Args: { p_business_id: string }; Returns: boolean };
      create_business: {
        Args: {
          p_category: string;
          p_content?: Json;
          p_name: string;
          p_slug: string;
          p_template: Database["public"]["Enums"]["template_key"];
        };
        Returns: string;
      };
      get_public_page: { Args: { p_slug: string }; Returns: Json };
      is_admin: { Args: never; Returns: boolean };
      is_member: { Args: { p_business_id: string }; Returns: boolean };
      publish_page: { Args: { p_business_id: string }; Returns: string };
      storage_can_write: { Args: { p_name: string }; Returns: boolean };
      submit_quote_request: {
        Args: {
          p_business_type?: string;
          p_email?: string;
          p_ip_hash: string;
          p_message?: string;
          p_name: string;
          p_phone?: string;
          p_product_id?: string;
        };
        Returns: string;
      };
    };
    Enums: {
      business_status: "active" | "suspended" | "archived";
      media_type: "logo" | "cover" | "gallery";
      member_role: "owner" | "editor";
      page_status: "draft" | "published" | "unpublished";
      quote_status: "new" | "contacted" | "closed";
      template_key: "hospitality" | "general";
      user_role: "admin" | "client";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      business_status: ["active", "suspended", "archived"],
      media_type: ["logo", "cover", "gallery"],
      member_role: ["owner", "editor"],
      page_status: ["draft", "published", "unpublished"],
      quote_status: ["new", "contacted", "closed"],
      template_key: ["hospitality", "general"],
      user_role: ["admin", "client"],
    },
  },
} as const;
