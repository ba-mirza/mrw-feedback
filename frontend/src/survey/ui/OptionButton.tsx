import { clsx } from "clsx";

import type { SurveyOption } from "@/shared/config/survey-questions";


import styles from "../SurveyApp.module.sass";

const STAR_PATH =
  "M12 2.8l2.83 5.74 6.33.92-4.58 4.46 1.08 6.3L12 17.24l-5.66 2.98 1.08-6.3-4.58-4.46 6.33-.92L12 2.8z";

interface OptionButtonProps {
  option: SurveyOption;
  isPending: boolean;
  isDisabled: boolean;
  onSelect: (value: string) => void;
}

export default function OptionButton({ option, isPending, isDisabled, onSelect }: OptionButtonProps) {
  const handleClick = () => onSelect(option.value);

  return (
    <button
      type="button"
      className={clsx(
        styles["survey__option"],
        styles[`survey__option--${option.tone}`],
        option.isStar && styles["survey__option--star"],
        isPending && styles["survey__option--pending"],
      )}
      disabled={isDisabled}
      aria-busy={isPending}
      onClick={handleClick}
    >
      {option.isStar && (
        <svg className={styles["survey__star"]} viewBox="0 0 24 24" aria-hidden="true">
          <path d={STAR_PATH} />
        </svg>
      )}
      <span className={styles["survey__option-label"]}>{option.label}</span>
    </button>
  );
}
