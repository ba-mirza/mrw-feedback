import { Group, Paper, Progress, Stack, Text, Title } from "@mantine/core";

import type { AvailabilityOption, StatsSummary } from "@/shared/api/types";

import { formatCount, formatRate } from "../lib/format";
import { SESSIONS_COLOR } from "../model/series";

const PERCENT = 100;

const OPTIONS: { value: AvailabilityOption; label: string }[] = [
  { value: "all", label: "Да, всё" },
  { value: "alternative", label: "Нашёл альтернативу" },
  { value: "partial", label: "Только часть" },
  { value: "none", label: "Нет" },
];

interface AvailabilityBreakdownProps {
  summary: StatsSummary | undefined;
}

export default function AvailabilityBreakdown({ summary }: AvailabilityBreakdownProps) {
  return (
    <Paper withBorder p="md" h="100%">
      <Title order={4} mb="md">
        Нашли ли всё, что искали
      </Title>
      <Stack gap="sm">
        {OPTIONS.map(({ value, label }) => {
          const metric = summary?.availability[value];
          const rate = metric?.rate ?? null;

          return (
            <div key={value}>
              <Group justify="space-between" mb={4}>
                <Text size="sm">{label}</Text>
                <Text size="sm" fw={600}>
                  {formatRate(rate)}{" "}
                  <Text span size="xs" c="dimmed" fw={400}>
                    ({formatCount(metric?.hits ?? 0)})
                  </Text>
                </Text>
              </Group>
              <Progress value={(rate ?? 0) * PERCENT} color={SESSIONS_COLOR} size="sm" radius="xl" aria-label={label} />
            </div>
          );
        })}
      </Stack>
    </Paper>
  );
}
