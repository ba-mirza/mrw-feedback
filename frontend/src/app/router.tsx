import { lazy, Suspense, type ReactNode } from "react";
import { Center, Loader } from "@mantine/core";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { ADMIN_ROUTES } from "@/shared/config/routes";
import AppLayout from "@/widgets/AppLayout";
import LoginPage from "@/pages/LoginPage";

import AuthGate from "./AuthGate";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const PointsPage = lazy(() => import("@/pages/PointsPage"));
const PrintPointPage = lazy(() => import("@/pages/PrintPointPage"));

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
          { index: true, element: <Navigate to={ADMIN_ROUTES.dashboard} replace /> },
          { path: ADMIN_ROUTES.dashboard, element: withSuspense(<DashboardPage />) },
          { path: ADMIN_ROUTES.points, element: withSuspense(<PointsPage />) },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
