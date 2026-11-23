import { surveyUrl } from "@/shared/lib/survey-url";

import type { PointRow } from "./database";
import { supabase } from "./supabase";
import type { Point, PointInput, PointList } from "./types";

const POINT_COLUMNS = "id, code, region, store, register_number, is_active, created_at, updated_at";

function toPoint(row: PointRow): Point {
  return { ...row, survey_url: surveyUrl(row.code) };
}

function trimInput(input: PointInput): PointInput {
  return {
    region: input.region.trim(),
    store: input.store.trim(),
    register_number: input.register_number.trim(),
    is_active: input.is_active,
  };
}

export async function fetchPoints(): Promise<PointList> {
  const { data, error } = await supabase
    .from("points")
    .select(POINT_COLUMNS)
    .order("region")
    .order("store")
    .order("register_number");
  if (error) throw error;

  return { items: data.map(toPoint) };
}

export async function fetchPoint(id: number) {
  const { data, error } = await supabase.from("points").select(POINT_COLUMNS).eq("id", id).single();
  if (error) throw error;

  return toPoint(data);
}

export async function createPoint(input: PointInput) {
  const { data, error } = await supabase.from("points").insert(trimInput(input)).select(POINT_COLUMNS).single();
  if (error) throw error;

  return toPoint(data);
}

export async function updatePoint(id: number, input: PointInput) {
  const { data, error } = await supabase
    .from("points")
    .update(trimInput(input))
    .eq("id", id)
    .select(POINT_COLUMNS)
    .single();
  if (error) throw error;

  return toPoint(data);
}
