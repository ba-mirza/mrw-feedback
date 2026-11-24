import { Paper, Table, Text, Title } from "@mantine/core";

import type { QuestionStats } from "@/shared/api/types";
import type { SurveyQuestionConfig } from "@/shared/config/survey-questions";
import { formatCount, formatRate } from "@/shared/lib/format";

interface QuestionTableProps {
  index: number;
  config: SurveyQuestionConfig;
  stats: QuestionStats | undefined;
}

export default function QuestionTable({ index, config, stats }: QuestionTableProps) {
  const counts = new Map(stats?.options.map((item) => [item.option, item]));

  return (
    <Paper withBorder p="md">
      <Title order={4}>
        {index}. {config.title}
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        Ответов: {formatCount(stats?.total ?? 0)}
      </Text>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Вариант</Table.Th>
            <Table.Th ta="right">Ответов</Table.Th>
            <Table.Th ta="right">Доля</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {config.options.map((option) => {
            const item = counts.get(option.value);

            return (
              <Table.Tr key={option.value}>
                <Table.Td>{option.reportLabel ?? option.label}</Table.Td>
                <Table.Td ta="right">{formatCount(item?.count ?? 0)}</Table.Td>
                <Table.Td ta="right" fw={600}>
                  {formatRate(item?.rate ?? null)}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
