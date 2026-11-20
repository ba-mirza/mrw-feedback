export const SURVEY_PATH_PREFIX = "/s/";

export const ADMIN_ROUTES = {
  login: "/login",
  points: "/points",
  stats: "/stats",
  printPoint: (id: number | string) => `/print/points/${id}`,
} as const;
