import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/shared/config/env";
import { getDeviceId } from "@/shared/lib/device-id";

export type SurveyQuestion = "consultant" | "availability" | "nps";

export interface SurveySession {
  id: string;
  status: "incomplete" | "completed";
  point: { store: string };
  answers: Partial<Record<SurveyQuestion, string>>;
}

const RAISED_ERROR_CODE = "P0001";
const NETWORK_ERROR = "network";

export class SurveyError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(reason);
    this.reason = reason;
  }
}

function readReason(body: unknown) {
  if (typeof body !== "object" || body === null || !("code" in body) || !("message" in body)) return NETWORK_ERROR;

  return body.code === RAISED_ERROR_CODE && typeof body.message === "string" ? body.message : NETWORK_ERROR;
}

async function callRpc(name: string, args: Record<string, string | undefined>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  }).catch(() => {
    throw new SurveyError(NETWORK_ERROR);
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new SurveyError(readReason(body));

  return body as SurveySession;
}

export function startSurveySession(code: string) {
  return callRpc("start_survey_session", { p_code: code, p_device_id: getDeviceId() });
}

export function saveSurveyAnswer(sessionId: string, question: SurveyQuestion, option: string) {
  return callRpc("save_survey_answer", { p_session_id: sessionId, p_question: question, p_option: option });
}
