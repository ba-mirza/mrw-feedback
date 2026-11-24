export interface AdminProfile {
  user_id: string;
  name: string;
}

export interface Point {
  id: number;
  code: string;
  region: string;
  store: string;
  register_number: string;
  is_active: boolean;
  survey_url: string;
  created_at: string;
  updated_at: string;
}

export type PointInput = Pick<Point, "region" | "store" | "register_number" | "is_active">;

export interface PointList {
  items: Point[];
}

export type QrFormat = "svg" | "png";

export interface StatsFilter {
  date_from?: string;
  date_to?: string;
  region?: string;
  store?: string;
  point_id?: number;
}

export interface OptionStats {
  option: string;
  count: number;
  rate: number | null;
}

export interface QuestionStats {
  question: "consultant" | "availability" | "nps";
  total: number;
  options: OptionStats[];
}

export interface SurveyStats {
  sessions: number;
  completed_sessions: number;
  questions: QuestionStats[];
}

export type BreakdownGroup = "store" | "point" | "day";

export interface BreakdownRow {
  key: string;
  region: string | null;
  store: string | null;
  register_number: string | null;
  point_id: number | null;
  day: string | null;
  sessions: number;
  completed: number;
  answers: Partial<Record<QuestionStats["question"], Record<string, number>>>;
}
