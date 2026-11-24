const PERCENT = 100;
const EMPTY_VALUE = "—";
const LOCALE = "ru-RU";

export function formatRate(rate: number | null) {
  if (rate === null) return EMPTY_VALUE;

  return `${(Math.round(rate * PERCENT * 10) / 10).toLocaleString(LOCALE)}%`;
}

export function formatCount(count: number) {
  return count.toLocaleString(LOCALE);
}
