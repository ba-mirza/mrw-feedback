import { Paper, SimpleGrid, Skeleton, Text } from "@mantine/core";

import type { RateMetric, StatsSummary } from "@/shared/api/types";

import { formatCount, formatRate } from "../lib/format";

interface KpiCardProps {
  label: string;
  value: string;
  hint: string;
}

function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <Paper withBorder p="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text fz={32} fw={700} lh={1.2} my={4}>
        {value}
      </Text>
      <Text size="xs" c="dimmed">
        {hint}
      </Text>
    </Paper>
  );
}

function answersHint(metric: RateMetric) {
  return `${formatCount(metric.hits)} из ${formatCount(metric.total)} ответов`;
}

interface KpiCardsProps {
  summary: StatsSummary | undefined;
}

export default function KpiCards({ summary }: KpiCardsProps) {
  if (!summary) {
    return (
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} h={110} />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
      <KpiCard label="Довольны консультацией" value={formatRate(summary.consultant.rate)} hint={answersHint(summary.consultant)} />
      <KpiCard
        label="Упущенный спрос"
        value={formatRate(summary.lost_demand.rate)}
        hint={`«Только часть» и «Нет»: ${answersHint(summary.lost_demand)}`}
      />
      <KpiCard label="Готовы рекомендовать" value={formatRate(summary.recommend.rate)} hint={answersHint(summary.recommend)} />
      <KpiCard
        label="Опросов"
        value={formatCount(summary.sessions)}
        hint={`До конца прошли ${formatRate(summary.completion_rate)} (${formatCount(summary.completed_sessions)})`}
      />
    </SimpleGrid>
  );
}
