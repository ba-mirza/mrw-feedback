import { supabase } from "./supabase";
import type { BreakdownGroup, StatsFilter } from "./types";

function toArgs(filter: StatsFilter) {
  return {
    p_date_from: filter.date_from,
    p_date_to: filter.date_to,
    p_region: filter.region,
    p_store: filter.store,
    p_point_id: filter.point_id,
  };
}

export async function fetchSurveyStats(filter: StatsFilter) {
  const { data, error } = await supabase.rpc("survey_stats", toArgs(filter));
  if (error) throw error;

  return data;
}

export async function fetchSurveyBreakdown(group: BreakdownGroup, filter: StatsFilter) {
  const { data, error } = await supabase.rpc("survey_breakdown", { p_group: group, ...toArgs(filter) });
  if (error) throw error;

  return data;
}
