export const SURVEY_PATH_PREFIX = "/s/";

export const ADMIN_ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  points: "/points",
  printPoint: (id: number | string) => `/print/points/${id}`,
} as const;
