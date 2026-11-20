import { useState } from "react";
import { Group, Paper, SegmentedControl, Table, Text, Title, UnstyledButton } from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconSelector } from "@tabler/icons-react";

import type { PointGrouping, PointStats } from "@/shared/api/types";

import { formatCount, formatRate } from "../lib/format";

type SortKey = "name" | "sessions" | "completion_rate" | "consultant_rate" | "lost_demand_rate" | "recommend_rate";
type SortDirection = "asc" | "desc";

const ICON_SIZE = 14;

const GROUPING_OPTIONS = [
  { value: "store", label: "Магазины" },
  { value: "point", label: "Кассы" },
];

const COLUMNS: { key: Exclude<SortKey, "name">; label: string; format: (item: PointStats) => string }[] = [
  { key: "sessions", label: "Опросов", format: (item) => formatCount(item.sessions) },
  { key: "completion_rate", label: "Прошли до конца", format: (item) => formatRate(item.completion_rate) },
  { key: "consultant_rate", label: "Довольны консультацией", format: (item) => formatRate(item.consultant_rate) },
  { key: "lost_demand_rate", label: "Упущенный спрос", format: (item) => formatRate(item.lost_demand_rate) },
  { key: "recommend_rate", label: "Рекомендуют", format: (item) => formatRate(item.recommend_rate) },
];

function itemName(item: PointStats) {
  return item.register_number ? `${item.store} · касса ${item.register_number}` : item.store;
}

function itemKey(item: PointStats) {
  return item.point_id ?? `${item.region}|${item.store}`;
}

function compareItems(a: PointStats, b: PointStats, key: SortKey) {
  if (key === "name") return itemName(a).localeCompare(itemName(b), "ru");
  const left = a[key];
  const right = b[key];
  if (left === null) return right === null ? 0 : 1;
  if (right === null) return -1;

  return left - right;
}

function sortItems(items: PointStats[], key: SortKey, direction: SortDirection) {
  return [...items].sort((a, b) => {
    const result = compareItems(a, b, key);
    const isNullOrdering = key !== "name" && (a[key] === null || b[key] === null);

    return direction === "asc" || isNullOrdering ? result : -result;
  });
}

interface SortHeaderProps {
  label: string;
  isActive: boolean;
  direction: SortDirection;
  onSort: () => void;
}

function SortHeader({ label, isActive, direction, onSort }: SortHeaderProps) {
  const Icon = isActive ? (direction === "asc" ? IconArrowUp : IconArrowDown) : IconSelector;

  return (
    <UnstyledButton onClick={onSort}>
      <Group gap={4} wrap="nowrap">
        <Text size="sm" fw={600}>
          {label}
        </Text>
        <Icon size={ICON_SIZE} />
      </Group>
    </UnstyledButton>
  );
}

interface PointsComparisonProps {
  items: PointStats[] | undefined;
  groupBy: PointGrouping;
  onGroupByChange: (value: PointGrouping) => void;
}

export default function PointsComparison({ items, groupBy, onGroupByChange }: PointsComparisonProps) {
  const [sortKey, setSortKey] = useState<SortKey>("consultant_rate");
  const [direction, setDirection] = useState<SortDirection>("asc");

  const rows = sortItems(items ?? [], sortKey, direction);
  const hasRows = rows.length > 0;

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection("asc");
  };

  return (
    <Paper withBorder p="md">
      <Group justify="space-between" mb="xs">
        <Title order={4}>Сравнение точек</Title>
        <SegmentedControl
          size="xs"
          data={GROUPING_OPTIONS}
          value={groupBy}
          onChange={(value) => onGroupByChange(value as PointGrouping)}
        />
      </Group>
      <Text size="xs" c="dimmed" mb="md">
        Сверху — точки с самой низкой оценкой консультантов. Нажмите на заголовок, чтобы отсортировать по другому столбцу.
      </Text>
      {hasRows ? (
        <Table.ScrollContainer minWidth={760}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <SortHeader
                    label={groupBy === "store" ? "Магазин" : "Касса"}
                    isActive={sortKey === "name"}
                    direction={direction}
                    onSort={() => handleSort("name")}
                  />
                </Table.Th>
                <Table.Th>Регион</Table.Th>
                {COLUMNS.map((column) => (
                  <Table.Th key={column.key}>
                    <SortHeader
                      label={column.label}
                      isActive={sortKey === column.key}
                      direction={direction}
                      onSort={() => handleSort(column.key)}
                    />
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((item) => (
                <Table.Tr key={itemKey(item)}>
                  <Table.Td>{itemName(item)}</Table.Td>
                  <Table.Td>{item.region}</Table.Td>
                  {COLUMNS.map((column) => (
                    <Table.Td key={column.key}>{column.format(item)}</Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : (
        <Text c="dimmed">За этот период ответов нет</Text>
      )}
    </Paper>
  );
}
