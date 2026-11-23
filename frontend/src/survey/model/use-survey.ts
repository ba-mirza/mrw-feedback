import { useCallback, useEffect, useState } from "react";

import { saveSurveyAnswer, startSurveySession, SurveyError, type SurveySession } from "@/shared/api/survey";
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
  const reason = error instanceof SurveyError ? error.reason : null;

  return reason && KNOWN_START_FAILURES.has(reason as SurveyFailure) ? (reason as SurveyFailure) : "network";
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
        const reason = error instanceof SurveyError ? error.reason : null;
        if (reason === "already_completed") setState({ kind: "thanks" });
        else if (reason === "session_expired" || reason === "session_not_found") retry();
        else setHasAnswerError(true);
      } finally {
        setPendingOption(null);
      }
    },
    [state, pendingOption, retry],
  );

  return { state, pendingOption, hasAnswerError, answer, retry };
}
