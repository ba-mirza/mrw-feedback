import { useEffect } from "react";
import { Alert, Autocomplete, Button, Group, Modal, Stack, Switch, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";

import { errorMessage } from "@/shared/api/errors";
import { useCreatePointMutation, useUpdatePointMutation } from "@/shared/api/points.queries";
import type { Point, PointInput } from "@/shared/api/types";

const EMPTY_VALUES: PointInput = { region: "", store: "", register_number: "", is_active: true };

function requiredText(label: string) {
  return (value: string) => (value.trim() ? null : `Укажите ${label}`);
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "ru"));
}

interface PointFormModalProps {
  opened: boolean;
  point: Point | null;
  points: Point[];
  onClose: () => void;
  onSaved: (point: Point, isNew: boolean) => void;
}

export default function PointFormModal({ opened, point, points, onClose, onSaved }: PointFormModalProps) {
  const form = useForm<PointInput>({
    initialValues: EMPTY_VALUES,
    validate: {
      region: requiredText("город или регион"),
      store: requiredText("магазин"),
      register_number: requiredText("номер кассы"),
    },
  });
  const createMutation = useCreatePointMutation();
  const updateMutation = useUpdatePointMutation();

  const isEditing = point !== null;
  const activeMutation = isEditing ? updateMutation : createMutation;
  const regionOptions = uniqueSorted(points.map((item) => item.region));
  const storeOptions = uniqueSorted(
    points.filter((item) => !form.values.region || item.region === form.values.region).map((item) => item.store),
  );
  const submitError = activeMutation.error ? errorMessage(activeMutation.error) : null;

  useEffect(() => {
    if (!opened) return;
    form.setValues(point ? { region: point.region, store: point.store, register_number: point.register_number, is_active: point.is_active } : EMPTY_VALUES);
    form.resetDirty();
    createMutation.reset();
    updateMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, point]);

  const handleSubmit = (values: PointInput) => {
    if (point) {
      updateMutation.mutate({ id: point.id, input: values }, { onSuccess: (saved) => onSaved(saved, false) });
      return;
    }
    createMutation.mutate(values, { onSuccess: (saved) => onSaved(saved, true) });
  };

  return (
    <Modal opened={opened} onClose={onClose} title={isEditing ? "Касса" : "Новая касса"} centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {submitError && <Alert color="red">{submitError}</Alert>}
          <Autocomplete label="Город / регион" data={regionOptions} data-autofocus {...form.getInputProps("region")} />
          <Autocomplete label="Магазин" placeholder="Например, ТРЦ Mega" data={storeOptions} {...form.getInputProps("store")} />
          <TextInput label="Номер кассы" {...form.getInputProps("register_number")} />
          {isEditing && (
            <Switch
              label="Принимает ответы"
              description="Выключенный QR показывает покупателю, что код не действует"
              {...form.getInputProps("is_active", { type: "checkbox" })}
            />
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" loading={activeMutation.isPending}>
              {isEditing ? "Сохранить" : "Создать и показать QR"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
