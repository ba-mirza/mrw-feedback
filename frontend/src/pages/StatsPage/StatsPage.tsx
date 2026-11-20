import { Alert, Container, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";

import { usePointsQuery } from "@/shared/api/points.queries";
import { useSurveyStatsQuery } from "@/shared/api/stats.queries";
import { SURVEY_QUESTIONS } from "@/shared/config/survey-questions";

import { useStatsFilter } from "./model/use-stats-filter";
import QuestionTable from "./ui/QuestionTable";
import StatsFilters from "./ui/StatsFilters";

export default function StatsPage() {
  const pointsQuery = usePointsQuery();
  const filterState = useStatsFilter(pointsQuery.data?.items ?? []);
  const statsQuery = useSurveyStatsQuery(filterState.filter);

  const stats = statsQuery.data;
  const statsByQuestion = new Map(stats?.questions.map((item) => [item.question, item]));

  return (
    <Container size="xl" py="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-end">
          <Title order={2}>Статистика</Title>
          {stats && (
            <Text size="sm" c="dimmed">
              Опросов: {stats.sessions.toLocaleString("ru-RU")} · до конца прошли:{" "}
              {stats.completed_sessions.toLocaleString("ru-RU")}
            </Text>
          )}
        </Group>
        <StatsFilters state={filterState} />
        {statsQuery.isError && <Alert color="red">Не удалось загрузить статистику</Alert>}
        <SimpleGrid cols={{ base: 1, md: 3 }}>
          {SURVEY_QUESTIONS.map((question, index) => (
            <QuestionTable
              key={question.id}
              index={index + 1}
              config={question}
              stats={statsByQuestion.get(question.id)}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
