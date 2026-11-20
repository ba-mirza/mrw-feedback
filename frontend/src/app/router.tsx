import { lazy, Suspense, type ReactNode } from "react";
import { Center, Loader } from "@mantine/core";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { ADMIN_ROUTES } from "@/shared/config/routes";
import AppLayout from "@/widgets/AppLayout";
import LoginPage from "@/pages/LoginPage";

import AuthGate from "./AuthGate";

const PointsPage = lazy(() => import("@/pages/PointsPage"));
const PrintPointPage = lazy(() => import("@/pages/PrintPointPage"));
const StatsPage = lazy(() => import("@/pages/StatsPage"));

function withSuspense(page: ReactNode) {
  return (
    <Suspense
      fallback={
        <Center py="xl">
          <Loader />
        </Center>
      }
    >
      {page}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  { path: ADMIN_ROUTES.login, element: <LoginPage /> },
  {
    element: <AuthGate />,
    children: [
      { path: "/print/points/:pointId", element: withSuspense(<PrintPointPage />) },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to={ADMIN_ROUTES.points} replace /> },
          { path: ADMIN_ROUTES.points, element: withSuspense(<PointsPage />) },
          { path: ADMIN_ROUTES.stats, element: withSuspense(<StatsPage />) },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
