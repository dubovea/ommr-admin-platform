import type {
  Control,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import {
  ADMIN_TABLE_GROUP_OPTIONS,
  ADMIN_TABLE_SOURCE_LABELS,
  ADMIN_TABLE_SOURCES,
  ADMIN_TABLE_STATUS_LABELS,
  ADMIN_TABLE_STATUSES,
  type AdminTableMeta,
} from "@ommr/shared";
import type { AdminTableFormValues } from "@ommr/shared/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMPTY_GROUP_VALUE } from "@/lib/table-groups";
import { LabelWithField } from "@/components/form/LabelWithField";

type Mode = "create" | "edit" | "view";

type MainInfoFormProps = {
  mode: Mode;
  control: Control<AdminTableFormValues>;
  register: UseFormRegister<AdminTableFormValues>;
  setValue: UseFormSetValue<AdminTableFormValues>;
  editTableData?: { data: AdminTableMeta };
};

export function MainInfoForm({
  mode,
  control,
  register,
  setValue,
  editTableData,
}: MainInfoFormProps) {
  const isDisabled = mode === "view";

  const updateGroupFields = (value: string) => {
    if (value === EMPTY_GROUP_VALUE) {
      setValue("groupName", null, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      return;
    }

    const selectedGroup = ADMIN_TABLE_GROUP_OPTIONS.find(
      (group) => group.id === value,
    );

    setValue("groupName", selectedGroup?.label ?? value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Основная информация</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-3">
        <input type="hidden" {...register("groupName")} />

        <LabelWithField label="Отображаемое имя" required>
          <Input
            {...register("label")}
            disabled={isDisabled}
            readOnly={mode === "view"}
          />
        </LabelWithField>

        <LabelWithField label="Имя таблицы в БД" required>
          <Input
            {...register("name")}
            disabled={isDisabled}
            readOnly={mode === "view"}
          />
        </LabelWithField>

        <LabelWithField label="Группировка таблицы">
          <Controller
            name="group"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? EMPTY_GROUP_VALUE}
                disabled={isDisabled}
                onValueChange={(value) => {
                  updateGroupFields(value);
                  field.onChange(value === EMPTY_GROUP_VALUE ? null : value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={EMPTY_GROUP_VALUE}>Без группы</SelectItem>

                  {ADMIN_TABLE_GROUP_OPTIONS.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </LabelWithField>

        {mode === "create" && (
          <>
            <LabelWithField label="Статус">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {ADMIN_TABLE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {ADMIN_TABLE_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </LabelWithField>

            <LabelWithField label="Источник">
              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {ADMIN_TABLE_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {ADMIN_TABLE_SOURCE_LABELS[source]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </LabelWithField>
          </>
        )}

        {mode === "edit" && (
          <LabelWithField label="ID таблицы в БД">
            <Input value={editTableData?.data.id ?? ""} readOnly disabled />
          </LabelWithField>
        )}

        <LabelWithField label="Описание">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                value={field.value ?? ""}
                disabled={isDisabled}
                readOnly={mode === "view"}
                onBlur={field.onBlur}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </LabelWithField>
      </CardContent>
    </Card>
  );
}
