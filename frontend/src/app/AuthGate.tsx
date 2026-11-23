import { Button, Center, Loader, Stack, Text, Title } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { logout } from "@/shared/api/auth";
import { useAdminProfileQuery } from "@/shared/api/profile.queries";
import { useAuthSession } from "@/shared/api/session";
import { ADMIN_ROUTES } from "@/shared/config/routes";

interface GateMessageProps {
  title: string;
  text: string;
}

function GateMessage({ title, text }: GateMessageProps) {
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
  };

  return (
    <Center h="100vh">
      <Stack align="center" gap="xs">
        <Title order={3}>{title}</Title>
        <Text c="dimmed">{text}</Text>
        <Button variant="default" onClick={() => void handleLogout()}>
          Выйти
        </Button>
      </Stack>
    </Center>
  );
}

export default function AuthGate() {
  const session = useAuthSession();
  const location = useLocation();
  const profileQuery = useAdminProfileQuery(session?.user.id ?? null);

  const isSessionLoading = session === undefined;
  const isSignedOut = session === null;

  if (isSessionLoading || (!isSignedOut && profileQuery.isPending)) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (isSignedOut) {
    return <Navigate to={ADMIN_ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  if (profileQuery.isError) {
    return <GateMessage title="Не удалось проверить доступ" text="Обновите страницу или войдите заново" />;
  }

  if (!profileQuery.data) {
    return <GateMessage title="Нет доступа" text="Учётная запись не добавлена в администраторы опросов" />;
  }

  return <Outlet />;
}
