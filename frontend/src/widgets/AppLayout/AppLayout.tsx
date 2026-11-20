import { Button, Container, Group, Tabs, Text } from "@mantine/core";
import { IconLogout, IconQrcode, IconTable } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import logo from "@/assets/logo.svg";
import { useAdminProfileQuery } from "@/shared/api/profile.queries";
import { ADMIN_ROUTES } from "@/shared/config/routes";
import { setAccessToken } from "@/shared/lib/session";

import styles from "./AppLayout.module.sass";

const ICON_SIZE = 16;

const SECTIONS = [
  { path: ADMIN_ROUTES.points, label: "Кассы и QR", icon: IconQrcode },
  { path: ADMIN_ROUTES.stats, label: "Статистика", icon: IconTable },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileQuery = useAdminProfileQuery(true);

  const activeSection = SECTIONS.find((section) => location.pathname.startsWith(section.path))?.path ?? null;

  const handleSectionChange = (path: string | null) => {
    if (path) navigate(path);
  };

  const handleLogout = () => {
    setAccessToken(null);
    queryClient.clear();
  };

  return (
    <div className={styles["app-layout"]}>
      <header className={styles["app-layout__header"]}>
        <Container size="xl" className={styles["app-layout__bar"]}>
          <Group gap="sm" wrap="nowrap">
            <img className={styles["app-layout__logo"]} src={logo} alt="MARWIN" width={100} height={32} />
            <Text c="dimmed" size="sm" visibleFrom="xs">
              опросы покупателей
            </Text>
          </Group>
          <Group gap="sm" wrap="nowrap">
            <Text size="sm" c="dimmed" visibleFrom="sm">
              {profileQuery.data?.name}
            </Text>
            <Button variant="subtle" color="gray" size="xs" leftSection={<IconLogout size={ICON_SIZE} />} onClick={handleLogout}>
              Выйти
            </Button>
          </Group>
        </Container>
        <Container size="xl">
          <Tabs value={activeSection} onChange={handleSectionChange} classNames={{ list: styles["app-layout__tabs"] }}>
            <Tabs.List>
              {SECTIONS.map(({ path, label, icon: Icon }) => (
                <Tabs.Tab key={path} value={path} leftSection={<Icon size={ICON_SIZE} />}>
                  {label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </Container>
      </header>
      <main className={styles["app-layout__main"]}>
        <Outlet />
      </main>
    </div>
  );
}
