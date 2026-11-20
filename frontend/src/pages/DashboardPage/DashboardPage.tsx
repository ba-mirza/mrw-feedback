import { useState } from "react";
import { Alert, Container, Grid, Stack, Title } from "@mantine/core";

import { usePointsQuery } from "@/shared/api/points.queries";
import { usePointStatsQuery, useStatsSummaryQuery, useStatsTimelineQuery } from "@/shared/api/stats.queries";
import type { PointGrouping, StatsFilter, StatsGranularity } from "@/shared/api/types";

import { useDashboardFilter } from "./model/use-dashboard-filter";
import AvailabilityBreakdown from "./ui/AvailabilityBreakdown";
import DashboardFilters from "./ui/DashboardFilters";
import KpiCards from "./ui/KpiCards";
import PointsComparison from "./ui/PointsComparison";
import TimelineCharts from "./ui/TimelineCharts";

const FALLBACK_FILTER: StatsFilter = { date_from: "", date_to: "" };

export default function DashboardPage() {
  const pointsQuery = usePointsQuery();
  const filterState = useDashboardFilter(pointsQuery.data?.items ?? []);
  const [granularity, setGranularity] = useState<StatsGranularity>("day");
  const [groupBy, setGroupBy] = useState<PointGrouping>("store");

  const filter = filterState.filter ?? FALLBACK_FILTER;
  const effectiveGranularity = filterState.isSingleDay ? "hour" : granularity;
  const summaryQuery = useStatsSummaryQuery(filter, filterState.filter !== null);
  const timelineQuery = useStatsTimelineQuery(filter, effectiveGranularity, filterState.filter !== null);
  const pointStatsQuery = usePointStatsQuery(filter, groupBy, filterState.filter !== null);

  const hasError = summaryQuery.isError || timelineQuery.isError || pointStatsQuery.isError;

  return (
    <Container size="xl" py="lg">
      <Stack gap="md">
        <Title order={2}>Дашборд</Title>
        <DashboardFilters state={filterState} />
        {hasError && <Alert color="red">Не удалось загрузить статистику. Обновите страницу.</Alert>}
        <KpiCards summary={summaryQuery.data} />
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <TimelineCharts timeline={timelineQuery.data} granularity={effectiveGranularity} onGranularityChange={setGranularity} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <AvailabilityBreakdown summary={summaryQuery.data} />
          </Grid.Col>
        </Grid>
        <PointsComparison items={pointStatsQuery.data?.items} groupBy={groupBy} onGroupByChange={setGroupBy} />
      </Stack>
    </Container>
  );
}
