import { request } from "./http";
import type { PointGrouping, PointStatsList, StatsFilter, StatsGranularity, StatsSummary, StatsTimeline } from "./types";

export function fetchStatsSummary(filter: StatsFilter) {
  return request<StatsSummary>("/v1/admin/stats/summary", { query: { ...filter } });
}

export function fetchStatsTimeline(filter: StatsFilter, granularity: StatsGranularity) {
  return request<StatsTimeline>("/v1/admin/stats/timeline", { query: { ...filter, granularity } });
}

export function fetchPointStats(filter: StatsFilter, groupBy: PointGrouping) {
  return request<PointStatsList>("/v1/admin/stats/points", { query: { ...filter, group_by: groupBy } });
}
