import { clsx } from "clsx";

import type { SurveyQuestionConfig } from "@/shared/config/survey-questions";

import OptionButton from "./OptionButton";

import styles from "../SurveyApp.module.sass";

interface QuestionStepProps {
  question: SurveyQuestionConfig;
  step: number;
  total: number;
  pendingOption: string | null;
  hasError: boolean;
  onSelect: (value: string) => void;
}

export default function QuestionStep({ question, step, total, pendingOption, hasError, onSelect }: QuestionStepProps) {
  const isBusy = pendingOption !== null;

  return (
    <section className={styles["survey__step"]} key={question.id}>
      <p className={styles["survey__progress"]}>
        Вопрос {step} из {total}
      </p>
      <h1 className={styles["survey__title"]}>{question.title}</h1>
      <div className={clsx(styles["survey__options"], styles[`survey__options--${question.layout}`])}>
        {question.options.map((option) => (
          <OptionButton
            key={option.value}
            option={option}
            isPending={pendingOption === option.value}
            isDisabled={isBusy}
            onSelect={onSelect}
          />
        ))}
      </div>
      {hasError && (
        <p className={styles["survey__error"]} role="alert">
          Не получилось отправить ответ. Проверьте интернет и нажмите ещё раз.
        </p>
      )}
    </section>
  );
}
