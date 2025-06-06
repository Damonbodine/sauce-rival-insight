export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      business_inputs: {
        Row: {
          business_category: string | null
          created_at: string
          description: string
          detected_industry: string | null
          id: string
          keywords: string[] | null
          url_analyzed: boolean | null
          website_url: string | null
        }
        Insert: {
          business_category?: string | null
          created_at?: string
          description: string
          detected_industry?: string | null
          id?: string
          keywords?: string[] | null
          url_analyzed?: boolean | null
          website_url?: string | null
        }
        Update: {
          business_category?: string | null
          created_at?: string
          description?: string
          detected_industry?: string | null
          id?: string
          keywords?: string[] | null
          url_analyzed?: boolean | null
          website_url?: string | null
        }
        Relationships: []
      }
      competitor_analysis: {
        Row: {
          attributes_json: Json
          business_id: string
          created_at: string
          id: string
          summary_insights: string
        }
        Insert: {
          attributes_json: Json
          business_id: string
          created_at?: string
          id?: string
          summary_insights: string
        }
        Update: {
          attributes_json?: Json
          business_id?: string
          created_at?: string
          id?: string
          summary_insights?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_analysis_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_inputs"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_raw_content: {
        Row: {
          content: string | null
          created_at: string
          firecrawl_id: string
          id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          firecrawl_id: string
          id?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          firecrawl_id?: string
          id?: string
        }
        Relationships: []
      }
      competitor_sites: {
        Row: {
          business_id: string
          crawl_error: string | null
          crawl_status: string | null
          crawled_at: string | null
          created_at: string
          firecrawl_id: string | null
          id: string
          name: string
          source_rank: number | null
          summary: string | null
          url: string
        }
        Insert: {
          business_id: string
          crawl_error?: string | null
          crawl_status?: string | null
          crawled_at?: string | null
          created_at?: string
          firecrawl_id?: string | null
          id?: string
          name: string
          source_rank?: number | null
          summary?: string | null
          url: string
        }
        Update: {
          business_id?: string
          crawl_error?: string | null
          crawl_status?: string | null
          crawled_at?: string | null
          created_at?: string
          firecrawl_id?: string | null
          id?: string
          name?: string
          source_rank?: number | null
          summary?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_sites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_inputs"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
