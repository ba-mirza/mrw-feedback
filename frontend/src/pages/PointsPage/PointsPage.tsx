import { useState } from "react";
import { ActionIcon, Alert, Badge, Button, Container, Group, Loader, Center, Table, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { IconPencil, IconPlus, IconQrcode, IconSearch } from "@tabler/icons-react";
import dayjs from "dayjs";

import { usePointsQuery } from "@/shared/api/points.queries";
import type { Point } from "@/shared/api/types";
import PointFormModal from "@/widgets/PointFormModal";
import PointQrModal from "@/widgets/PointQrModal";

const ICON_SIZE = 16;
const DATE_FORMAT = "DD.MM.YYYY";

function matchesSearch(point: Point, search: string) {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;

  return [point.region, point.store, point.register_number].some((value) => value.toLowerCase().includes(needle));
}

export default function PointsPage() {
  const pointsQuery = usePointsQuery();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<Point | null>(null);
  const [qrPointId, setQrPointId] = useState<number | null>(null);

  const points = pointsQuery.data?.items ?? [];
  const visiblePoints = points.filter((point) => matchesSearch(point, search));
  const qrPoint = points.find((point) => point.id === qrPointId) ?? null;
  const hasPoints = points.length > 0;

  const handleCreate = () => {
    setEditingPoint(null);
    setIsFormOpen(true);
  };

  const handleEdit = (point: Point) => {
    setEditingPoint(point);
    setIsFormOpen(true);
  };

  const handleFormClose = () => setIsFormOpen(false);

  const handleSaved = (point: Point, isNew: boolean) => {
    setIsFormOpen(false);
    if (isNew) setQrPointId(point.id);
  };

  return (
    <Container size="xl" py="lg">
      <Group justify="space-between" mb="md">
        <Title order={2}>Кассы и QR</Title>
        <Button leftSection={<IconPlus size={ICON_SIZE} />} onClick={handleCreate}>
          Добавить кассу
        </Button>
      </Group>

      {pointsQuery.isError && <Alert color="red">Не удалось загрузить кассы</Alert>}
      {pointsQuery.isPending && (
        <Center py="xl">
          <Loader />
        </Center>
      )}
      {pointsQuery.isSuccess && !hasPoints && (
        <Text c="dimmed">Касс пока нет. Создайте первую, и появится QR для печати.</Text>
      )}
      {hasPoints && (
        <>
          <TextInput
            mb="md"
            maw={360}
            placeholder="Поиск по городу, магазину, кассе"
            leftSection={<IconSearch size={ICON_SIZE} />}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
          <Table.ScrollContainer minWidth={640}>
            <Table highlightOnHover verticalSpacing="sm" bg="white">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Город / регион</Table.Th>
                  <Table.Th>Магазин</Table.Th>
                  <Table.Th>Касса</Table.Th>
                  <Table.Th>Статус</Table.Th>
                  <Table.Th>Создана</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visiblePoints.map((point) => (
                  <Table.Tr key={point.id}>
                    <Table.Td>{point.region}</Table.Td>
                    <Table.Td>{point.store}</Table.Td>
                    <Table.Td>{point.register_number}</Table.Td>
                    <Table.Td>
                      <Badge color={point.is_active ? "teal" : "gray"} variant="light">
                        {point.is_active ? "Активна" : "Выключена"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{dayjs(point.created_at).format(DATE_FORMAT)}</Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end" wrap="nowrap">
                        <Tooltip label="QR-код">
                          <ActionIcon variant="subtle" aria-label="QR-код" onClick={() => setQrPointId(point.id)}>
                            <IconQrcode size={ICON_SIZE} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Изменить">
                          <ActionIcon variant="subtle" color="gray" aria-label="Изменить" onClick={() => handleEdit(point)}>
                            <IconPencil size={ICON_SIZE} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </>
      )}

      <PointFormModal
        opened={isFormOpen}
        point={editingPoint}
        points={points}
        onClose={handleFormClose}
        onSaved={handleSaved}
      />
      <PointQrModal point={qrPoint} onClose={() => setQrPointId(null)} />
    </Container>
  );
}
