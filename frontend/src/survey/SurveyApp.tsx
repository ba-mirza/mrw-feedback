import logo from "@/assets/logo.svg";
import { SURVEY_PATH_PREFIX } from "@/shared/config/routes";
import { SURVEY_QUESTIONS } from "@/shared/config/survey-questions";

import { useSurvey, type SurveyFailure } from "./model/use-survey";
import MessageScreen from "./ui/MessageScreen";
import QuestionStep from "./ui/QuestionStep";

import styles from "./SurveyApp.module.sass";

const FAILURE_MESSAGES: Record<SurveyFailure, { title: string; text: string }> = {
  already_completed: { title: "Спасибо!", text: "Вы уже ответили на наши вопросы. Нам очень важно ваше мнение." },
  point_not_found: { title: "QR-код не действует", text: "Попробуйте отсканировать код на другой кассе." },
  network: { title: "Не удалось открыть опрос", text: "Проверьте подключение к интернету и попробуйте ещё раз." },
};

function readCode() {
  return decodeURIComponent(window.location.pathname.slice(SURVEY_PATH_PREFIX.length).split("/")[0] ?? "");
}

export default function SurveyApp() {
  const { state, pendingOption, hasAnswerError, answer, retry } = useSurvey(readCode());

  const handleSelect = (value: string) => void answer(value);

  return (
    <div className={styles["survey"]}>
      <header className={styles["survey__header"]}>
        <img className={styles["survey__logo"]} src={logo} alt="MARWIN" width={120} height={38} />
      </header>
      <main className={styles["survey__body"]} aria-live="polite">
        {state.kind === "loading" && <div className={styles["survey__loader"]} aria-label="Загрузка" />}
        {state.kind === "question" && (
          <QuestionStep
            question={SURVEY_QUESTIONS[state.index]}
            step={state.index + 1}
            total={SURVEY_QUESTIONS.length}
            pendingOption={pendingOption}
            hasError={hasAnswerError}
            onSelect={handleSelect}
          />
        )}
        {state.kind === "thanks" && (
          <MessageScreen title="Спасибо за ответы!" text="Ваше мнение помогает нам становиться лучше." />
        )}
        {state.kind === "failed" && (
          <MessageScreen
            {...FAILURE_MESSAGES[state.reason]}
            action={
              state.reason === "network" && (
                <button type="button" className={styles["survey__retry"]} onClick={retry}>
                  Попробовать снова
                </button>
              )
            }
          />
        )}
      </main>
    </div>
  );
}
