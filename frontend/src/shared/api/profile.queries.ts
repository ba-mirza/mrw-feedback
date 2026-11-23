import { useQuery } from "@tanstack/react-query";

import { QUERY_STALE_TIME } from "@/shared/config/query-cache";

import { fetchAdminProfile } from "./auth";

export const profileQueryKeys = {
  root: ["admin-profile"] as const,
  detail: (userId: string) => [...profileQueryKeys.root, userId] as const,
};

export function useAdminProfileQuery(userId: string | null) {
  return useQuery({
    queryKey: profileQueryKeys.detail(userId ?? ""),
    queryFn: fetchAdminProfile,
    enabled: userId !== null,
    retry: false,
    staleTime: QUERY_STALE_TIME.profile,
  });
}
