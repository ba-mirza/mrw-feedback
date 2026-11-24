import dayjs from "dayjs";

import type { BreakdownGroup, BreakdownRow, QuestionStats } from "@/shared/api/types";

export const MIN_SAMPLE = 20;

export interface BreakdownMetric {
  id: string;
  question: QuestionStats["question"];
  option: string;
  label: string;
}

export const BREAKDOWN_METRICS: BreakdownMetric[] = [
  { id: "consultant", question: "consultant", option: "green", label: "Зелёная звезда" },
  { id: "availability", question: "availability", option: "all", label: "Нашли всё" },
  { id: "nps", question: "nps", option: "yes", label: "Порекомендуют" },
];

export const BREAKDOWN_GROUPS: { value: BreakdownGroup; label: string }[] = [
  { value: "store", label: "Магазины" },
  { value: "point", label: "Кассы" },
  { value: "day", label: "По дням" },
];

export type SortColumn = "name" | "sessions" | string;

export interface SortState {
  column: SortColumn;
  direction: "asc" | "desc";
}

export interface MetricValue {
  hits: number;
  total: number;
  rate: number | null;
  isLowSample: boolean;
}

const DAY_FORMAT = "DD.MM.YYYY, dd";

export function defaultSort(group: BreakdownGroup): SortState {
  return group === "day" ? { column: "name", direction: "desc" } : { column: "sessions", direction: "desc" };
}

export function metricValue(row: BreakdownRow, metric: BreakdownMetric): MetricValue {
  const options = row.answers[metric.question] ?? {};
  const total = Object.values(options).reduce((sum, count) => sum + count, 0);
  const hits = options[metric.option] ?? 0;

  return { hits, total, rate: total > 0 ? hits / total : null, isLowSample: total < MIN_SAMPLE };
}

export function rowName(row: BreakdownRow, group: BreakdownGroup) {
  if (group === "day") return dayjs(row.day).locale("ru").format(DAY_FORMAT);
  if (group === "point") return `${row.store} · касса ${row.register_number}`;

  return row.store ?? "";
}

function sortName(row: BreakdownRow, group: BreakdownGroup) {
  return group === "day" ? (row.day ?? "") : rowName(row, group);
}

function compareRates(left: MetricValue, right: MetricValue) {
  if (left.isLowSample !== right.isLowSample) return left.isLowSample ? 1 : -1;

  return (left.rate ?? -1) - (right.rate ?? -1);
}

export function sortRows(rows: BreakdownRow[], group: BreakdownGroup, sort: SortState) {
  const sign = sort.direction === "asc" ? 1 : -1;
  const metric = BREAKDOWN_METRICS.find((item) => item.id === sort.column);

  return [...rows].sort((left, right) => {
    if (metric) {
      const leftValue = metricValue(left, metric);
      const rightValue = metricValue(right, metric);
      if (leftValue.isLowSample !== rightValue.isLowSample) return compareRates(leftValue, rightValue);
      return sign * compareRates(leftValue, rightValue);
    }
    if (sort.column === "sessions") return sign * (left.sessions - right.sessions);

    return sign * sortName(left, group).localeCompare(sortName(right, group), "ru");
  });
}
