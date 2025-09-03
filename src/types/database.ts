// Database types for Supabase integration
// Based on the comprehensive project specification

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          name: string | null;
          system_preset: string | null;
          join_code: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          system_preset?: string | null;
          join_code: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          system_preset?: string | null;
          join_code?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
      players: {
        Row: {
          room_id: string;
          user_id: string;
          display_name: string;
          color_id: number;
          role: 'gm' | 'player';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          room_id: string;
          user_id: string;
          display_name: string;
          color_id: number;
          role?: 'gm' | 'player';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          room_id?: string;
          user_id?: string;
          display_name?: string;
          color_id?: number;
          role?: 'gm' | 'player';
          created_at?: string;
          updated_at?: string;
        };
      };
      variables: {
        Row: {
          id: string;
          room_id: string;
          owner_user_id: string | null;
          key: string;
          value: any; // jsonb
          visibility: 'public' | 'gm' | 'private';
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          owner_user_id?: string | null;
          key: string;
          value: any;
          visibility?: 'public' | 'gm' | 'private';
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          owner_user_id?: string | null;
          key?: string;
          value?: any;
          visibility?: 'public' | 'gm' | 'private';
          updated_at?: string;
        };
      };
      macros: {
        Row: {
          id: string;
          room_id: string;
          owner_user_id: string | null;
          name: string;
          expression: string;
          sort_index: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          owner_user_id?: string | null;
          name: string;
          expression: string;
          sort_index?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          owner_user_id?: string | null;
          name?: string;
          expression?: string;
          sort_index?: number;
          updated_at?: string;
        };
      };
      rolls: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          expression: string;
          result: any; // jsonb - detailed breakdown
          total: number;
          visibility: 'public' | 'gm' | 'whisper';
          recipients: string[] | null;
          tag: string | null;
          tn: any | null; // jsonb - {op:'>=', value:15, pass:true}
          server_proof: string | null;
          request_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          expression: string;
          result: any;
          total: number;
          visibility?: 'public' | 'gm' | 'whisper';
          recipients?: string[] | null;
          tag?: string | null;
          tn?: any | null;
          server_proof?: string | null;
          request_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          expression?: string;
          result?: any;
          total?: number;
          visibility?: 'public' | 'gm' | 'whisper';
          recipients?: string[] | null;
          tag?: string | null;
          tn?: any | null;
          server_proof?: string | null;
          request_id?: string | null;
          created_at?: string;
        };
      };
      roll_requests: {
        Row: {
          id: string;
          room_id: string;
          gm_id: string;
          label: string;
          expression: string;
          recipients: string[] | null;
          visibility: 'public' | 'gm';
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          gm_id: string;
          label: string;
          expression: string;
          recipients?: string[] | null;
          visibility?: 'public' | 'gm';
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          gm_id?: string;
          label?: string;
          expression?: string;
          recipients?: string[] | null;
          visibility?: 'public' | 'gm';
          created_at?: string;
        };
      };
      variable_templates: {
        Row: {
          id: string;
          room_id: string;
          key: string;
          label: string;
          description: string | null;
          default_value: any | null;
          required: boolean;
          scope: 'user' | 'room';
        };
        Insert: {
          id?: string;
          room_id: string;
          key: string;
          label: string;
          description?: string | null;
          default_value?: any | null;
          required?: boolean;
          scope: 'user' | 'room';
        };
        Update: {
          id?: string;
          room_id?: string;
          key?: string;
          label?: string;
          description?: string | null;
          default_value?: any | null;
          required?: boolean;
          scope?: 'user' | 'room';
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type Room = Database['public']['Tables']['rooms']['Row'];
export type Player = Database['public']['Tables']['players']['Row'];
export type Variable = Database['public']['Tables']['variables']['Row'];
export type Macro = Database['public']['Tables']['macros']['Row'];
export type Roll = Database['public']['Tables']['rolls']['Row'];
export type RollRequest = Database['public']['Tables']['roll_requests']['Row'];
export type VariableTemplate = Database['public']['Tables']['variable_templates']['Row'];

// Insert types
export type RoomInsert = Database['public']['Tables']['rooms']['Insert'];
export type PlayerInsert = Database['public']['Tables']['players']['Insert'];
export type VariableInsert = Database['public']['Tables']['variables']['Insert'];
export type MacroInsert = Database['public']['Tables']['macros']['Insert'];
export type RollInsert = Database['public']['Tables']['rolls']['Insert'];
export type RollRequestInsert = Database['public']['Tables']['roll_requests']['Insert'];
export type VariableTemplateInsert = Database['public']['Tables']['variable_templates']['Insert'];
