import { Group, Select } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconCalendar } from "@tabler/icons-react";

import type { DateRange, StatsFilterState } from "../model/use-stats-filter";

const ICON_SIZE = 16;
const SELECT_WIDTH = 220;
const DATE_FORMAT = "DD.MM.YYYY";

interface StatsFiltersProps {
  state: StatsFilterState;
}

export default function StatsFilters({ state }: StatsFiltersProps) {
  return (
    <Group gap="sm" align="flex-end">
      <Select
        label="Город"
        placeholder="Все города"
        data={state.regionOptions}
        value={state.region}
        onChange={state.changeRegion}
        clearable
        searchable
        w={SELECT_WIDTH}
      />
      <Select
        label="Магазин"
        placeholder="Все магазины"
        data={state.storeOptions}
        value={state.store}
        onChange={state.changeStore}
        clearable
        searchable
        w={SELECT_WIDTH}
      />
      <Select
        label="Касса"
        placeholder="Все кассы"
        data={state.registerOptions}
        value={state.pointId}
        onChange={state.changePoint}
        clearable
        searchable
        w={SELECT_WIDTH}
      />
      <DatePickerInput
        type="range"
        label="Период"
        placeholder="За всё время"
        leftSection={<IconCalendar size={ICON_SIZE} />}
        valueFormat={DATE_FORMAT}
        maxDate={new Date()}
        allowSingleDateInRange
        clearable
        value={state.range}
        onChange={(value) => state.changeRange(value as DateRange)}
        w={SELECT_WIDTH + 40}
      />
    </Group>
  );
}
