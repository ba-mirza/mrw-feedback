import { request } from "./http";
import type { StatsFilter, SurveyStats } from "./types";

export function fetchSurveyStats(filter: StatsFilter) {
  return request<SurveyStats>("/v1/admin/stats/questions", { query: { ...filter } });
}
