import type { Point } from "@/shared/api/types";

export function pointLabel(point: Pick<Point, "store" | "register_number">) {
  return `${point.store} · касса ${point.register_number}`;
}
