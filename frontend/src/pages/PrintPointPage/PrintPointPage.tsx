import { Alert, Center, Loader } from "@mantine/core";
import { useParams } from "react-router-dom";

import logo from "@/assets/logo.svg";
import { usePointQrQuery, usePointQuery } from "@/shared/api/points.queries";

import styles from "./PrintPointPage.module.sass";

function handleQrLoad() {
  if (typeof window === "undefined") return;
  window.print();
}

export default function PrintPointPage() {
  const { pointId } = useParams();
  const pointQuery = usePointQuery(Number(pointId));
  const qrQuery = usePointQrQuery(pointQuery.data ?? null);

  const point = pointQuery.data;

  if (pointQuery.isError) {
    return (
      <Center h="100vh">
        <Alert color="red">Касса не найдена</Alert>
      </Center>
    );
  }

  if (!point || !qrQuery.data) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  return (
    <div className={styles["print-point"]}>
      <article className={styles["print-point__card"]}>
        <img className={styles["print-point__logo"]} src={logo} alt="MARWIN" />
        <h1 className={styles["print-point__title"]}>Оцените нашу работу</h1>
        <p className={styles["print-point__text"]}>Наведите камеру телефона на код. Это три вопроса, меньше минуты.</p>
        <img className={styles["print-point__qr"]} src={qrQuery.data} alt="QR-код опроса" onLoad={handleQrLoad} />
        <p className={styles["print-point__meta"]}>
          {point.store} · касса {point.register_number}
        </p>
      </article>
    </div>
  );
}
