export interface AdminProfile {
  id: number;
  name: string;
  email: string;
  permissions: string[];
}

export interface AuthTokens {
  access_token: string;
  expires_in: number;
}

export interface ValidationIssue {
  field: string;
  message: string;
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
  date_from: string;
  date_to: string;
  region?: string;
  store?: string;
  point_id?: number;
}

export type StatsGranularity = "hour" | "day";

export interface RateMetric {
  total: number;
  hits: number;
  rate: number | null;
}

export type AvailabilityOption = "all" | "alternative" | "partial" | "none";

export interface StatsSummary {
  sessions: number;
  completed_sessions: number;
  completion_rate: number | null;
  consultant: RateMetric;
  lost_demand: RateMetric;
  recommend: RateMetric;
  availability: Record<AvailabilityOption, RateMetric>;
}

export interface TimelineItem {
  bucket: string;
  sessions: number;
  completed_sessions: number;
  consultant_rate: number | null;
  lost_demand_rate: number | null;
  recommend_rate: number | null;
}

export interface StatsTimeline {
  granularity: StatsGranularity;
  items: TimelineItem[];
}

export type PointGrouping = "point" | "store";

export interface PointStats {
  point_id: number | null;
  region: string;
  store: string;
  register_number: string | null;
  sessions: number;
  completed_sessions: number;
  completion_rate: number | null;
  consultant_rate: number | null;
  lost_demand_rate: number | null;
  recommend_rate: number | null;
}

export interface PointStatsList {
  items: PointStats[];
}
