import type { SurveyQuestion } from "@/shared/api/survey";

export type OptionTone = "success" | "danger" | "neutral";

export interface SurveyOption {
  value: string;
  label: string;
  tone: OptionTone;
  isStar?: boolean;
}

export interface SurveyQuestionConfig {
  id: SurveyQuestion;
  title: string;
  layout: "pair" | "list";
  options: SurveyOption[];
}

export const SURVEY_QUESTIONS: SurveyQuestionConfig[] = [
  {
    id: "consultant",
    title: "Довольны ли вы работой консультанта?",
    layout: "pair",
    options: [
      { value: "green", label: "Доволен", tone: "success", isStar: true },
      { value: "red", label: "Не доволен", tone: "danger", isStar: true },
    ],
  },
  {
    id: "availability",
    title: "Вы нашли всё, что искали?",
    layout: "list",
    options: [
      { value: "all", label: "Да, всё", tone: "neutral" },
      { value: "alternative", label: "Нашёл альтернативу", tone: "neutral" },
      { value: "partial", label: "Только часть", tone: "neutral" },
      { value: "none", label: "Нет", tone: "neutral" },
    ],
  },
  {
    id: "nps",
    title: "Порекомендуете MARWIN друзьям и близким?",
    layout: "pair",
    options: [
      { value: "yes", label: "Да", tone: "success" },
      { value: "no", label: "Нет", tone: "danger" },
    ],
  },
];
