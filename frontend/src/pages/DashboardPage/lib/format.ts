const PERCENT = 100;
const EMPTY_VALUE = "—";

export function toPercent(rate: number | null) {
  return rate === null ? null : Math.round(rate * PERCENT * 10) / 10;
}

export function formatRate(rate: number | null) {
  const percent = toPercent(rate);

  return percent === null ? EMPTY_VALUE : `${percent.toLocaleString("ru-RU")}%`;
}

export function formatCount(value: number) {
  return value.toLocaleString("ru-RU");
}
