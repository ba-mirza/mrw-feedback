import { useState } from "react";
import dayjs from "dayjs";

import type { Point, StatsFilter } from "@/shared/api/types";

export type PeriodPreset = "day" | "week" | "month" | "custom";

export type DateRange = [Date | null, Date | null];

const API_DATE_FORMAT = "YYYY-MM-DD";
const PRESET_DAYS: Record<Exclude<PeriodPreset, "custom">, number> = { day: 1, week: 7, month: 30 };

function presetRange(preset: Exclude<PeriodPreset, "custom">): DateRange {
  const today = dayjs().startOf("day");

  return [today.subtract(PRESET_DAYS[preset] - 1, "day").toDate(), today.toDate()];
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "ru"));
}

export function useDashboardFilter(points: Point[]) {
  const [preset, setPreset] = useState<PeriodPreset>("week");
  const [range, setRange] = useState<DateRange>(() => presetRange("week"));
  const [region, setRegion] = useState<string | null>(null);
  const [store, setStore] = useState<string | null>(null);
  const [pointId, setPointId] = useState<string | null>(null);

  const [dateFrom, dateTo] = range;
  const isRangeComplete = dateFrom !== null && dateTo !== null;
  const regionOptions = uniqueSorted(points.map((point) => point.region));
  const storeOptions = uniqueSorted(
    points.filter((point) => !region || point.region === region).map((point) => point.store),
  );
  const registerOptions = points
    .filter((point) => (!region || point.region === region) && (!store || point.store === store))
    .map((point) => ({ value: String(point.id), label: store ? `Касса ${point.register_number}` : `${point.store} · касса ${point.register_number}` }));
  const filter: StatsFilter | null = isRangeComplete
    ? {
        date_from: dayjs(dateFrom).format(API_DATE_FORMAT),
        date_to: dayjs(dateTo).format(API_DATE_FORMAT),
        region: region ?? undefined,
        store: store ?? undefined,
        point_id: pointId ? Number(pointId) : undefined,
      }
    : null;
  const isSingleDay = filter !== null && filter.date_from === filter.date_to;

  const changePreset = (value: string) => {
    const next = value as PeriodPreset;
    setPreset(next);
    if (next !== "custom") setRange(presetRange(next));
  };

  const changeRange = (value: DateRange) => {
    setPreset("custom");
    setRange(value);
  };

  const changeRegion = (value: string | null) => {
    setRegion(value);
    setStore(null);
    setPointId(null);
  };

  const changeStore = (value: string | null) => {
    setStore(value);
    setPointId(null);
  };

  return {
    preset,
    range,
    region,
    store,
    pointId,
    filter,
    isSingleDay,
    regionOptions,
    storeOptions,
    registerOptions,
    changePreset,
    changeRange,
    changeRegion,
    changeStore,
    changePoint: setPointId,
  };
}

export type DashboardFilterState = ReturnType<typeof useDashboardFilter>;
