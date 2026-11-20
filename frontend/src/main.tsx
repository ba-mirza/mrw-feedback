import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";

import { SURVEY_PATH_PREFIX } from "@/shared/config/routes";

const SurveyApp = lazy(() => import("@/survey/SurveyApp"));
const AdminApp = lazy(() => import("@/app/App"));

const root = document.getElementById("root");
const isSurvey = window.location.pathname.startsWith(SURVEY_PATH_PREFIX);

if (root) {
  createRoot(root).render(
    <StrictMode>
      <Suspense fallback={null}>{isSurvey ? <SurveyApp /> : <AdminApp />}</Suspense>
    </StrictMode>,
  );
}
