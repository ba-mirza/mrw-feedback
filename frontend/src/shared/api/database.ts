import type { QuestionStats } from "./types";

type PointRow = {
  id: number;
  code: string;
  region: string;
  store: string;
  register_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type PointWrite = {
  region?: string;
  store?: string;
  register_number?: string;
  is_active?: boolean;
}

type AdminRow = {
  user_id: string;
  name: string;
  created_at: string;
}

type SurveyStatsArgs = {
  p_date_from?: string;
  p_date_to?: string;
  p_region?: string;
  p_store?: string;
  p_point_id?: number;
}

type SurveyStatsResult = {
  sessions: number;
  completed_sessions: number;
  questions: QuestionStats[];
}

export type Database = {
  public: {
    Tables: {
      points: { Row: PointRow; Insert: PointWrite; Update: PointWrite; Relationships: [] };
      admins: { Row: AdminRow; Insert: never; Update: never; Relationships: [] };
    };
    Views: { [_ in never]: never };
    Functions: {
      survey_stats: { Args: SurveyStatsArgs; Returns: SurveyStatsResult };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

export type { PointRow };
