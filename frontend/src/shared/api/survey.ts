import { getDeviceId } from "@/shared/lib/device-id";

import { request } from "./http";

export type SurveyQuestion = "consultant" | "availability" | "nps";

export interface SurveySession {
  id: string;
  status: "incomplete" | "completed";
  point: { store: string };
  answers: Partial<Record<SurveyQuestion, string>>;
}

export function startSurveySession(code: string) {
  return request<SurveySession>("/v1/survey/sessions", { method: "POST", body: { code, device_id: getDeviceId() } });
}

export function saveSurveyAnswer(sessionId: string, question: SurveyQuestion, option: string) {
  return request<SurveySession>(`/v1/survey/sessions/${sessionId}/answers`, {
    method: "POST",
    body: { question, option },
  });
}
