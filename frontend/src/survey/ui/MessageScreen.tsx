import { type ReactNode } from "react";

import styles from "../SurveyApp.module.sass";

interface MessageScreenProps {
  title: string;
  text?: string;
  action?: ReactNode;
}

export default function MessageScreen({ title, text, action }: MessageScreenProps) {
  return (
    <section className={styles["survey__message"]}>
      <h1 className={styles["survey__title"]}>{title}</h1>
      {text && <p className={styles["survey__text"]}>{text}</p>}
      {action}
    </section>
  );
}
