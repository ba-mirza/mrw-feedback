import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_STALE_TIME } from "@/shared/config/query-cache";

import { createPoint, fetchPoint, fetchPoints, fetchPointQr, updatePoint } from "./points";
import type { Point, PointInput, PointList } from "./types";

export const pointsQueryKeys = {
  root: ["points"] as const,
  list: () => [...pointsQueryKeys.root, "list"] as const,
  detail: (id: number) => [...pointsQueryKeys.root, "detail", id] as const,
  qr: (id: number, code: string) => [...pointsQueryKeys.root, "qr", id, code] as const,
};

function upsertPoint(list: PointList | undefined, point: Point): PointList | undefined {
  if (!list) return list;
  const exists = list.items.some((item) => item.id === point.id);
  const items = exists ? list.items.map((item) => (item.id === point.id ? point : item)) : [...list.items, point];

  return { items };
}

export function usePointsQuery() {
  return useQuery({ queryKey: pointsQueryKeys.list(), queryFn: fetchPoints, staleTime: QUERY_STALE_TIME.points });
}

export function usePointQuery(id: number) {
  return useQuery({
    queryKey: pointsQueryKeys.detail(id),
    queryFn: () => fetchPoint(id),
    enabled: Number.isFinite(id),
    staleTime: QUERY_STALE_TIME.points,
  });
}

export function usePointQrQuery(point: Point | null) {
  return useQuery({
    queryKey: pointsQueryKeys.qr(point?.id ?? 0, point?.code ?? ""),
    queryFn: async () => URL.createObjectURL(await fetchPointQr(point?.id ?? 0, "svg")),
    enabled: point !== null,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

function usePointMutationHandlers() {
  const queryClient = useQueryClient();

  return {
    onSuccess: (point: Point) => {
      queryClient.setQueryData<PointList>(pointsQueryKeys.list(), (list) => upsertPoint(list, point));
      queryClient.setQueryData(pointsQueryKeys.detail(point.id), point);
    },
  };
}

export function useCreatePointMutation() {
  const handlers = usePointMutationHandlers();

  return useMutation({ mutationFn: (input: PointInput) => createPoint(input), ...handlers });
}

export function useUpdatePointMutation() {
  const handlers = usePointMutationHandlers();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: PointInput }) => updatePoint(id, input),
    ...handlers,
  });
}
