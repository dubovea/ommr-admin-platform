import { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { type AdminTableActionKey } from "@ommr/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

type Mode = "create" | "edit" | "view";

type ActionsFormProps = {
  mode: Mode;
  control: Control<any>;
  isUpdating?: boolean;
};

const ACTIONS: Array<[AdminTableActionKey, string]> = [
  ["canList", "Список"],
  ["canCreate", "Создание"],
  ["canEdit", "Редактирование"],
  ["canDelete", "Удаление"],
];

export function ActionsForm({
  mode,
  control,
  isUpdating = false,
}: ActionsFormProps) {
  const isDisabled = mode === "view" || isUpdating;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Доступные действия</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {ACTIONS.map(([key, label]) => (
          <Controller
            key={key}
            name={key}
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <Switch
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                  disabled={isDisabled}
                />
              </div>
            )}
          />
        ))}

        <Separator />

        <Controller
          name="showInMenu"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm">Отображать в меню</div>
                <div className="text-xs text-muted-foreground">
                  Если выключено, таблица останется в metadata, но не попадёт в
                  sidebar.
                </div>
              </div>
              <Switch
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
                disabled={isDisabled}
              />
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
