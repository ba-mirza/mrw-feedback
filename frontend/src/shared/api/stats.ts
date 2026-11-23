import { supabase } from "./supabase";
import type { StatsFilter } from "./types";

export async function fetchSurveyStats(filter: StatsFilter) {
  const { data, error } = await supabase.rpc("survey_stats", {
    p_date_from: filter.date_from,
    p_date_to: filter.date_to,
    p_region: filter.region,
    p_store: filter.store,
    p_point_id: filter.point_id,
  });
  if (error) throw error;

  return data;
}
