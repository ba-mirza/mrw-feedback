import { BarChart, LineChart } from "@mantine/charts";
import { Center, Group, Paper, SegmentedControl, Stack, Text, Title } from "@mantine/core";
import dayjs from "dayjs";

import type { StatsGranularity, StatsTimeline } from "@/shared/api/types";

import { formatCount, toPercent } from "../lib/format";
import { RATE_SERIES, SESSIONS_COLOR } from "../model/series";

const CHART_HEIGHT = 260;
const SESSIONS_CHART_HEIGHT = 160;
const PERCENT_DOMAIN: [number, number] = [0, 100];

const GRANULARITY_OPTIONS = [
  { value: "day", label: "По дням" },
  { value: "hour", label: "По часам" },
];

function bucketLabel(bucket: string, granularity: StatsGranularity) {
  return granularity === "day" ? dayjs(bucket).format("DD.MM") : bucket;
}

function percentLabel(value: number) {
  return `${value.toLocaleString("ru-RU")}%`;
}

interface TimelineChartsProps {
  timeline: StatsTimeline | undefined;
  granularity: StatsGranularity;
  onGranularityChange: (value: StatsGranularity) => void;
}

export default function TimelineCharts({ timeline, granularity, onGranularityChange }: TimelineChartsProps) {
  const items = timeline?.items ?? [];
  const hasData = items.some((item) => item.sessions > 0);
  const data = items.map((item) => ({
    bucket: bucketLabel(item.bucket, granularity),
    consultant: toPercent(item.consultant_rate),
    lost_demand: toPercent(item.lost_demand_rate),
    recommend: toPercent(item.recommend_rate),
    sessions: item.sessions,
  }));

  return (
    <Paper withBorder p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>Динамика</Title>
        <SegmentedControl
          size="xs"
          data={GRANULARITY_OPTIONS}
          value={granularity}
          onChange={(value) => onGranularityChange(value as StatsGranularity)}
        />
      </Group>
      {granularity === "hour" && (
        <Text size="xs" c="dimmed" mb="sm">
          Час суток по времени Алматы, суммарно за выбранный период
        </Text>
      )}
      {hasData ? (
        <Stack gap="lg">
          <LineChart
            h={CHART_HEIGHT}
            data={data}
            dataKey="bucket"
            series={RATE_SERIES.map(({ name, label, color }) => ({ name, label, color }))}
            curveType="linear"
            strokeWidth={2}
            dotProps={{ r: 3 }}
            activeDotProps={{ r: 5 }}
            connectNulls={false}
            withLegend
            legendProps={{ verticalAlign: "top", height: 40 }}
            yAxisProps={{ domain: PERCENT_DOMAIN }}
            valueFormatter={percentLabel}
            gridAxis="y"
          />
          <div>
            <Text size="sm" fw={600} mb="xs">
              Количество опросов
            </Text>
            <BarChart
              h={SESSIONS_CHART_HEIGHT}
              data={data}
              dataKey="bucket"
              series={[{ name: "sessions", label: "Опросов", color: SESSIONS_COLOR }]}
              valueFormatter={formatCount}
              barProps={{ radius: [4, 4, 0, 0] }}
              gridAxis="y"
            />
          </div>
        </Stack>
      ) : (
        <Center h={CHART_HEIGHT}>
          <Text c="dimmed">За этот период ответов нет</Text>
        </Center>
      )}
    </Paper>
  );
}
