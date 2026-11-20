import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/shared/api/http";
import { saveSurveyAnswer, startSurveySession, type SurveySession } from "@/shared/api/survey";
import { SURVEY_QUESTIONS } from "@/shared/config/survey-questions";

export type SurveyFailure = "already_completed" | "point_not_found" | "network";

export type SurveyState =
  | { kind: "loading" }
  | { kind: "question"; session: SurveySession; index: number }
  | { kind: "thanks" }
  | { kind: "failed"; reason: SurveyFailure };

const KNOWN_START_FAILURES = new Set<SurveyFailure>(["already_completed", "point_not_found"]);

function nextQuestionIndex(session: SurveySession) {
  return SURVEY_QUESTIONS.findIndex((question) => session.answers[question.id] === undefined);
}

function toState(session: SurveySession): SurveyState {
  const index = nextQuestionIndex(session);
  if (session.status === "completed" || index === -1) return { kind: "thanks" };

  return { kind: "question", session, index };
}

function startFailure(error: unknown): SurveyFailure {
  const code = error instanceof ApiError ? error.code : null;

  return code && KNOWN_START_FAILURES.has(code as SurveyFailure) ? (code as SurveyFailure) : "network";
}

export function useSurvey(code: string) {
  const [state, setState] = useState<SurveyState>({ kind: "loading" });
  const [pendingOption, setPendingOption] = useState<string | null>(null);
  const [hasAnswerError, setHasAnswerError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    startSurveySession(code)
      .then((session) => {
        if (!isCancelled) setState(toState(session));
      })
      .catch((error: unknown) => {
        if (!isCancelled) setState({ kind: "failed", reason: startFailure(error) });
      });

    return () => {
      isCancelled = true;
    };
  }, [code, attempt]);

  const retry = useCallback(() => {
    setState({ kind: "loading" });
    setAttempt((current) => current + 1);
  }, []);

  const answer = useCallback(
    async (option: string) => {
      if (state.kind !== "question" || pendingOption !== null) return;
      const question = SURVEY_QUESTIONS[state.index];

      setPendingOption(option);
      setHasAnswerError(false);
      try {
        setState(toState(await saveSurveyAnswer(state.session.id, question.id, option)));
      } catch (error) {
        const errorCode = error instanceof ApiError ? error.code : null;
        if (errorCode === "already_completed") setState({ kind: "thanks" });
        else if (errorCode === "session_expired") retry();
        else setHasAnswerError(true);
      } finally {
        setPendingOption(null);
      }
    },
    [state, pendingOption, retry],
  );

  return { state, pendingOption, hasAnswerError, answer, retry };
}
