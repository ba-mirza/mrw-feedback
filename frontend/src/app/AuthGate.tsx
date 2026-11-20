import { Center, Loader, Stack, Text, Title } from "@mantine/core";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAdminProfileQuery } from "@/shared/api/profile.queries";
import { ADMIN_ROUTES } from "@/shared/config/routes";
import { useAccessToken } from "@/shared/lib/session";

const ADMIN_PERMISSIONS = ["points", "stats"];

export default function AuthGate() {
  const token = useAccessToken();
  const location = useLocation();
  const profileQuery = useAdminProfileQuery(token !== null);

  const hasToken = token !== null;
  const hasAccess = ADMIN_PERMISSIONS.some((permission) => profileQuery.data?.permissions.includes(permission));

  if (!hasToken || profileQuery.isError) {
    return <Navigate to={ADMIN_ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  if (profileQuery.isPending) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!hasAccess) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="xs">
          <Title order={3}>Нет доступа</Title>
          <Text c="dimmed">У учётной записи нет прав на опросы</Text>
        </Stack>
      </Center>
    );
  }

  return <Outlet />;
}
