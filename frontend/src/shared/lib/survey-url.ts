import { SURVEY_PATH_PREFIX } from "@/shared/config/routes";

export function surveyUrl(code: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  return `${origin}${SURVEY_PATH_PREFIX}${code}`;
}
