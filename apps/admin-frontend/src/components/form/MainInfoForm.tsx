import { Control, Controller, UseFormRegister, UseFormSetValue } from "react-hook-form";
import {
  ADMIN_TABLE_GROUP_OPTIONS,
  type AdminTableMeta,
  type UpdateAdminTableInput,
} from "@ommr/shared";
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
  control: Control<UpdateAdminTableInput>;
  register: UseFormRegister<UpdateAdminTableInput>;
  setValue: UseFormSetValue<UpdateAdminTableInput>;
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
      setValue("group", null, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

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

    const groupName = selectedGroup?.label ?? value;

    setValue("group", value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    setValue("groupName", groupName, {
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
                onValueChange={updateGroupFields}
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

        {mode === "edit" && (
          <LabelWithField label="ID таблицы в БД">
            <Input value={editTableData?.data.id ?? ""} readOnly disabled />
          </LabelWithField>
        )}

        <LabelWithField label="Описание">
          <Textarea
            {...register("description")}
            disabled={isDisabled}
            readOnly={mode === "view"}
          />
        </LabelWithField>
      </CardContent>
    </Card>
  );
}