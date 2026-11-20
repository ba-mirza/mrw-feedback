import { useState } from "react";
import dayjs from "dayjs";

import type { Point, StatsFilter } from "@/shared/api/types";

export type DateRange = [Date | null, Date | null];

const API_DATE_FORMAT = "YYYY-MM-DD";

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "ru"));
}

function toApiDate(value: Date | null) {
  return value ? dayjs(value).format(API_DATE_FORMAT) : undefined;
}

export function useStatsFilter(points: Point[]) {
  const [region, setRegion] = useState<string | null>(null);
  const [store, setStore] = useState<string | null>(null);
  const [pointId, setPointId] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>([null, null]);

  const regionOptions = uniqueSorted(points.map((point) => point.region));
  const storeOptions = uniqueSorted(
    points.filter((point) => !region || point.region === region).map((point) => point.store),
  );
  const registerOptions = points
    .filter((point) => (!region || point.region === region) && (!store || point.store === store))
    .map((point) => ({
      value: String(point.id),
      label: store ? `Касса ${point.register_number}` : `${point.store} · касса ${point.register_number}`,
    }));
  const [dateFrom, dateTo] = range;
  const isRangePartial = dateFrom !== null && dateTo === null;
  const filter: StatsFilter = {
    date_from: toApiDate(dateFrom),
    date_to: toApiDate(isRangePartial ? dateFrom : dateTo),
    region: region ?? undefined,
    store: store ?? undefined,
    point_id: pointId ? Number(pointId) : undefined,
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
    region,
    store,
    pointId,
    range,
    filter,
    regionOptions,
    storeOptions,
    registerOptions,
    changeRegion,
    changeStore,
    changePoint: setPointId,
    changeRange: setRange,
  };
}

export type StatsFilterState = ReturnType<typeof useStatsFilter>;
