import { useState } from "react";
import { Alert, Group, Paper, SegmentedControl, Table, Text, Title, Tooltip, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconChevronUp, IconSelector } from "@tabler/icons-react";

import { useSurveyBreakdownQuery } from "@/shared/api/stats.queries";
import type { BreakdownGroup, BreakdownRow, StatsFilter } from "@/shared/api/types";
import { formatCount, formatRate } from "@/shared/lib/format";

import {
  BREAKDOWN_GROUPS,
  BREAKDOWN_METRICS,
  defaultSort,
  MIN_SAMPLE,
  metricValue,
  rowName,
  sortRows,
  type BreakdownMetric,
  type SortColumn,
  type SortState,
} from "../model/breakdown";

const ICON_SIZE = 14;
const TABLE_MIN_WIDTH = 720;
const NAME_HEADERS: Record<BreakdownGroup, string> = { store: "Магазин", point: "Касса", day: "День" };
const LOW_SAMPLE_HINT = `Меньше ${MIN_SAMPLE} ответов: процент неточный`;

interface SortHeaderProps {
  column: SortColumn;
  label: string;
  sort: SortState;
  align?: "left" | "right";
  onSort: (column: SortColumn) => void;
}

function SortHeader({ column, label, sort, align = "right", onSort }: SortHeaderProps) {
  const isActive = sort.column === column;
  const Icon = isActive ? (sort.direction === "asc" ? IconChevronUp : IconChevronDown) : IconSelector;

  return (
    <Table.Th ta={align}>
      <UnstyledButton onClick={() => onSort(column)}>
        <Group gap={4} wrap="nowrap" justify={align === "right" ? "flex-end" : "flex-start"}>
          <Text size="sm" fw={600}>
            {label}
          </Text>
          <Icon size={ICON_SIZE} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

interface MetricCellProps {
  row: BreakdownRow;
  metric: BreakdownMetric;
}

function MetricCell({ row, metric }: MetricCellProps) {
  const value = metricValue(row, metric);
  const caption = `${formatCount(value.hits)} из ${formatCount(value.total)}`;
  const rate = (
    <Text size="sm" fw={600} c={value.isLowSample ? "dimmed" : undefined} span>
      {formatRate(value.rate)}
    </Text>
  );

  return (
    <Table.Td ta="right">
      {value.isLowSample && value.total > 0 ? <Tooltip label={LOW_SAMPLE_HINT}>{rate}</Tooltip> : rate}
      <Text size="xs" c="dimmed">
        {caption}
      </Text>
    </Table.Td>
  );
}

interface BreakdownTableProps {
  filter: StatsFilter;
}

export default function BreakdownTable({ filter }: BreakdownTableProps) {
  const [group, setGroup] = useState<BreakdownGroup>("store");
  const [sort, setSort] = useState<SortState>(defaultSort("store"));
  const breakdownQuery = useSurveyBreakdownQuery(group, filter);

  const rows = sortRows(breakdownQuery.data ?? [], group, sort);
  const isEmpty = breakdownQuery.isSuccess && rows.length === 0;

  const handleGroupChange = (value: string) => {
    const nextGroup = value as BreakdownGroup;
    setGroup(nextGroup);
    setSort(defaultSort(nextGroup));
  };

  const handleSort = (column: SortColumn) => {
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === "asc" ? "desc" : "asc" }
        : { column, direction: column === "name" ? "asc" : "desc" },
    );
  };

  return (
    <Paper withBorder p="md">
      <Group justify="space-between" mb="sm">
        <Title order={4}>Сравнение</Title>
        <SegmentedControl data={BREAKDOWN_GROUPS} value={group} onChange={handleGroupChange} />
      </Group>
      {breakdownQuery.isError && <Alert color="red">Не удалось загрузить сравнение</Alert>}
      {isEmpty && <Text c="dimmed">Нет ответов за выбранный период</Text>}
      {rows.length > 0 && (
        <Table.ScrollContainer minWidth={TABLE_MIN_WIDTH}>
          <Table highlightOnHover verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <SortHeader column="name" label={NAME_HEADERS[group]} align="left" sort={sort} onSort={handleSort} />
                <SortHeader column="sessions" label="Опросов" sort={sort} onSort={handleSort} />
                {BREAKDOWN_METRICS.map((metric) => (
                  <SortHeader key={metric.id} column={metric.id} label={metric.label} sort={sort} onSort={handleSort} />
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => (
                <Table.Tr key={row.key}>
                  <Table.Td>
                    <Text size="sm">{rowName(row, group)}</Text>
                    {row.region && (
                      <Text size="xs" c="dimmed">
                        {row.region}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td ta="right">{formatCount(row.sessions)}</Table.Td>
                  {BREAKDOWN_METRICS.map((metric) => (
                    <MetricCell key={metric.id} row={row} metric={metric} />
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Paper>
  );
}
