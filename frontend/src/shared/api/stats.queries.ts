import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { QUERY_STALE_TIME } from "@/shared/config/query-cache";

import { fetchSurveyStats } from "./stats";
import type { StatsFilter } from "./types";

export const statsQueryKeys = {
  root: ["stats"] as const,
  questions: (filter: StatsFilter) => [...statsQueryKeys.root, "questions", filter] as const,
};

export function useSurveyStatsQuery(filter: StatsFilter) {
  return useQuery({
    queryKey: statsQueryKeys.questions(filter),
    queryFn: () => fetchSurveyStats(filter),
    staleTime: QUERY_STALE_TIME.stats,
    placeholderData: keepPreviousData,
  });
}
