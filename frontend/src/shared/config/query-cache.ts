const MINUTE = 60_000;

export const QUERY_STALE_TIME = {
  profile: 5 * MINUTE,
  points: 30_000,
  stats: 30_000,
} as const;
