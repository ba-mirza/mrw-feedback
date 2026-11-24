import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { QUERY_STALE_TIME } from "@/shared/config/query-cache";

import { fetchSurveyBreakdown, fetchSurveyStats } from "./stats";
import type { BreakdownGroup, StatsFilter } from "./types";

export const statsQueryKeys = {
  root: ["stats"] as const,
  questions: (filter: StatsFilter) => [...statsQueryKeys.root, "questions", filter] as const,
  breakdown: (group: BreakdownGroup, filter: StatsFilter) => [...statsQueryKeys.root, "breakdown", group, filter] as const,
};

export function useSurveyStatsQuery(filter: StatsFilter) {
  return useQuery({
    queryKey: statsQueryKeys.questions(filter),
    queryFn: () => fetchSurveyStats(filter),
    staleTime: QUERY_STALE_TIME.stats,
    placeholderData: keepPreviousData,
  });
}

export function useSurveyBreakdownQuery(group: BreakdownGroup, filter: StatsFilter) {
  return useQuery({
    queryKey: statsQueryKeys.breakdown(group, filter),
    queryFn: () => fetchSurveyBreakdown(group, filter),
    staleTime: QUERY_STALE_TIME.stats,
    placeholderData: keepPreviousData,
  });
}
