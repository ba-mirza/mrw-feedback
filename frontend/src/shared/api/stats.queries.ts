import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { QUERY_STALE_TIME } from "@/shared/config/query-cache";

import { fetchPointStats, fetchStatsSummary, fetchStatsTimeline } from "./stats";
import type { PointGrouping, StatsFilter, StatsGranularity } from "./types";

export const statsQueryKeys = {
  root: ["stats"] as const,
  summary: (filter: StatsFilter) => [...statsQueryKeys.root, "summary", filter] as const,
  timeline: (filter: StatsFilter, granularity: StatsGranularity) =>
    [...statsQueryKeys.root, "timeline", filter, granularity] as const,
  points: (filter: StatsFilter, groupBy: PointGrouping) => [...statsQueryKeys.root, "points", filter, groupBy] as const,
};

const SHARED_OPTIONS = { staleTime: QUERY_STALE_TIME.stats, placeholderData: keepPreviousData };

export function useStatsSummaryQuery(filter: StatsFilter, enabled: boolean) {
  return useQuery({
    queryKey: statsQueryKeys.summary(filter),
    queryFn: () => fetchStatsSummary(filter),
    enabled,
    ...SHARED_OPTIONS,
  });
}

export function useStatsTimelineQuery(filter: StatsFilter, granularity: StatsGranularity, enabled: boolean) {
  return useQuery({
    queryKey: statsQueryKeys.timeline(filter, granularity),
    queryFn: () => fetchStatsTimeline(filter, granularity),
    enabled,
    ...SHARED_OPTIONS,
  });
}

export function usePointStatsQuery(filter: StatsFilter, groupBy: PointGrouping, enabled: boolean) {
  return useQuery({
    queryKey: statsQueryKeys.points(filter, groupBy),
    queryFn: () => fetchPointStats(filter, groupBy),
    enabled,
    ...SHARED_OPTIONS,
  });
}
