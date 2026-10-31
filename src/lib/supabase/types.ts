// Tipos do banco no formato do `supabase gen types typescript`, escritos à mão a partir de
// supabase/migrations/0001_init.sql. Mantenha em sincronia ao criar novas migrations.
import type { Level, Theme } from "@/lib/quiz/domain";

type Empty = { [_ in never]: never };

export type Database = {
  public: {
    Tables: {
      questions: {
        Row: {
          id: string;
          theme: Theme;
          level: Level;
          statement: string;
          options: string[];
          correct_index: number;
          explanation: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          theme: Theme;
          level: Level;
          statement: string;
          options: string[];
          correct_index: number;
          explanation: string;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>;
        Relationships: [];
      };
      quiz_sessions: {
        Row: {
          id: string;
          player_name: string;
          theme: Theme | null;
          level: Level;
          question_ids: string[];
          is_retry: boolean;
          score: number | null;
          total: number;
          started_at: string;
          finished_at: string | null;
          duration_ms: number | null;
        };
        Insert: {
          id?: string;
          player_name: string;
          theme?: Theme | null;
          level: Level;
          question_ids: string[];
          is_retry?: boolean;
          score?: number | null;
          total: number;
          started_at?: string;
          finished_at?: string | null;
          duration_ms?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_sessions"]["Insert"]>;
        Relationships: [];
      };
      session_answers: {
        Row: {
          session_id: string;
          question_id: string;
          selected_index: number;
          is_correct: boolean;
          answered_at: string;
        };
        Insert: {
          session_id: string;
          question_id: string;
          selected_index: number;
          is_correct: boolean;
          answered_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["session_answers"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Empty;
    Functions: Empty;
    Enums: { quiz_theme: Theme; quiz_level: Level };
    CompositeTypes: Empty;
  };
};
