import { useQuery } from "@tanstack/react-query";

import { QUERY_STALE_TIME } from "@/shared/config/query-cache";

import { fetchAdminProfile } from "./auth";

export const profileQueryKeys = {
  root: ["admin-profile"] as const,
};

export function useAdminProfileQuery(enabled: boolean) {
  return useQuery({
    queryKey: profileQueryKeys.root,
    queryFn: fetchAdminProfile,
    enabled,
    retry: false,
    staleTime: QUERY_STALE_TIME.profile,
  });
}
