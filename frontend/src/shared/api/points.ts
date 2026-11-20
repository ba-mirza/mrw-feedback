import { request, requestBlob } from "./http";
import type { Point, PointInput, PointList, QrFormat } from "./types";

export function fetchPoints() {
  return request<PointList>("/v1/admin/points");
}

export function fetchPoint(id: number) {
  return request<Point>(`/v1/admin/points/${id}`);
}

export function createPoint(input: PointInput) {
  return request<Point>("/v1/admin/points", { method: "POST", body: input });
}

export function updatePoint(id: number, input: PointInput) {
  return request<Point>(`/v1/admin/points/${id}`, { method: "PUT", body: input });
}

export function fetchPointQr(id: number, format: QrFormat) {
  return requestBlob(`/v1/admin/points/${id}/qr`, { query: { format } });
}
