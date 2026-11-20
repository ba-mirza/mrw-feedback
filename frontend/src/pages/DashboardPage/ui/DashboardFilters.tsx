import { Group, Paper, SegmentedControl, Select } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconCalendar } from "@tabler/icons-react";

import type { DashboardFilterState, DateRange } from "../model/use-dashboard-filter";

const ICON_SIZE = 16;
const SELECT_WIDTH = 200;

const PRESET_OPTIONS = [
  { value: "day", label: "День" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "custom", label: "Период" },
];

interface DashboardFiltersProps {
  state: DashboardFilterState;
}

export default function DashboardFilters({ state }: DashboardFiltersProps) {
  return (
    <Paper withBorder p="md">
      <Group gap="sm" align="flex-end">
        <SegmentedControl data={PRESET_OPTIONS} value={state.preset} onChange={state.changePreset} />
        <DatePickerInput
          type="range"
          aria-label="Период"
          leftSection={<IconCalendar size={ICON_SIZE} />}
          valueFormat="DD.MM.YYYY"
          maxDate={new Date()}
          allowSingleDateInRange
          value={state.range}
          onChange={(value) => state.changeRange(value as DateRange)}
          miw={230}
        />
        <Select
          placeholder="Все регионы"
          data={state.regionOptions}
          value={state.region}
          onChange={state.changeRegion}
          clearable
          searchable
          w={SELECT_WIDTH}
        />
        <Select
          placeholder="Все магазины"
          data={state.storeOptions}
          value={state.store}
          onChange={state.changeStore}
          clearable
          searchable
          w={SELECT_WIDTH}
        />
        <Select
          placeholder="Все кассы"
          data={state.registerOptions}
          value={state.pointId}
          onChange={state.changePoint}
          clearable
          searchable
          w={SELECT_WIDTH}
        />
      </Group>
    </Paper>
  );
}
