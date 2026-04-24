import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Link2, X } from "lucide-react";
import {
  DEFAULT_FIELD_VALIDATION,
  FIELD_INPUT_TYPE_LABELS,
  FIELD_INPUT_TYPES,
  type AdminFieldFlagKey,
  type AdminFieldMeta,
  type AdminTableMeta,
  type FieldDefaultValue,
  type FieldOption,
  type FieldValidationMeta,
  type UpdateAdminFieldInput,
} from "@ommr/shared";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createRelationFieldPatch,
  createTargetTableRelationPatch,
  getRelationFields,
  getRelationTargetTables,
  shouldShowRelationSettings,
} from "@/lib/field-relation-ui";

export function FieldInspector({
  tablesData,
  field,
  onChange,
  onClose,
}: {
  tablesData: AdminTableMeta[];
  field: AdminFieldMeta;
  onChange: (payload: UpdateAdminFieldInput) => void;
  onClose: () => void;
}) {
  const fieldLabel = field.label || field.name;

  const [defaultValueText, setDefaultValueText] = useState(() =>
    toPrettyJson(field.defaultValue ?? null),
  );
  const [optionsText, setOptionsText] = useState(() =>
    toPrettyJson(field.options ?? []),
  );
  const [validationText, setValidationText] = useState(() =>
    toPrettyJson(field.validation ?? DEFAULT_FIELD_VALIDATION),
  );

  useEffect(() => {
    setDefaultValueText(toPrettyJson(field.defaultValue ?? null));
    setOptionsText(toPrettyJson(field.options ?? []));
    setValidationText(
      toPrettyJson(field.validation ?? DEFAULT_FIELD_VALIDATION),
    );
  }, [field.id, field.defaultValue, field.options, field.validation]);

  const relationEnabled = shouldShowRelationSettings(field);

  const relationTargetTables = useMemo(
    () => getRelationTargetTables(tablesData, field.tableId),
    [tablesData, field.tableId],
  );

  const selectedRelationTable = useMemo(
    () =>
      relationTargetTables.find(
        (table) => table.id === field.relation?.targetTableId,
      ) ?? null,
    [relationTargetTables, field.relation?.targetTableId],
  );

  const selectedRelationFields = getRelationFields(selectedRelationTable);

  function patchRelationField(
    key: "targetKey" | "displayField" | "additionalText",
    value: string | null,
  ) {
    const patch = createRelationFieldPatch({
      field,
      key,
      value,
    });

    if (!patch) {
      return;
    }

    onChange(patch);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold">Настройки поля</h2>

          <div className="mt-3 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
              <Link2 className="size-5" />
            </div>

            <div>
              <div className="font-semibold">{fieldLabel}</div>
              <div className="text-xs text-muted-foreground">
                {field.name} · {field.relation ? "Поле связи" : field.dbType}
              </div>
            </div>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <Separator />

      <LabeledInput
        label="Название поля *"
        value={field.label}
        onChange={(value) => onChange({ label: value })}
      />

      <div className="space-y-2">
        <FormLabel>Тип поля *</FormLabel>

        <Select
          value={field.inputType}
          onValueChange={(value) => {
            onChange({
              inputType: value as AdminFieldMeta["inputType"],
            });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {FIELD_INPUT_TYPES.map((type) => (
              <SelectItem value={type} key={type}>
                {FIELD_INPUT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {relationEnabled && (
        <>
          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">
              Настройки связи с другой таблицей
            </h3>

            {relationTargetTables.length === 0 ? (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Нет доступных таблиц с полями для настройки связи.
              </div>
            ) : (
              <>
                <FormLabel>Таблица связи *</FormLabel>

                <Select
                  value={field.relation?.targetTableId ?? ""}
                  onValueChange={(targetTableId) => {
                    onChange(createTargetTableRelationPatch(targetTableId));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите таблицу" />
                  </SelectTrigger>

                  <SelectContent>
                    {relationTargetTables.map((table) => (
                      <SelectItem value={table.id} key={table.id}>
                        {table.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <FormLabel>Ключ связи (target_key)</FormLabel>

                <Select
                  value={field.relation?.targetKey ?? ""}
                  disabled={
                    !field.relation?.targetTableId ||
                    selectedRelationFields.length === 0
                  }
                  onValueChange={(targetKey) => {
                    patchRelationField("targetKey", targetKey);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Backend подставит автоматически" />
                  </SelectTrigger>

                  <SelectContent>
                    {selectedRelationFields.map((targetField) => (
                      <SelectItem value={targetField.name} key={targetField.id}>
                        {targetField.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <FormLabel>Отображаемое поле (display_field)</FormLabel>

                <Select
                  value={field.relation?.displayField ?? ""}
                  disabled={
                    !field.relation?.targetTableId ||
                    selectedRelationFields.length === 0
                  }
                  onValueChange={(displayField) => {
                    patchRelationField("displayField", displayField);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Backend подставит автоматически" />
                  </SelectTrigger>

                  <SelectContent>
                    {selectedRelationFields.map((targetField) => (
                      <SelectItem value={targetField.name} key={targetField.id}>
                        {targetField.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <FormLabel>Дополнительный текст (additional_text)</FormLabel>

                <Select
                  value={field.relation?.additionalText ?? "__none__"}
                  disabled={
                    !field.relation?.targetTableId ||
                    selectedRelationFields.length === 0
                  }
                  onValueChange={(additionalText) => {
                    patchRelationField(
                      "additionalText",
                      additionalText === "__none__" ? null : additionalText,
                    );
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Не использовать" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="__none__">Не использовать</SelectItem>

                    {selectedRelationFields.map((targetField) => (
                      <SelectItem value={targetField.name} key={targetField.id}>
                        {targetField.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </>
      )}

      <Separator />

      <div className="space-y-3">
        {(
          [
            ["visible", "Отображать поле"],
            ["required", "Обязательное поле"],
            ["editable", "Редактируемое поле"],
          ] satisfies Array<[AdminFieldFlagKey, string]>
        ).map(([key, label]) => (
          <div className="flex items-center justify-between" key={key}>
            <span className="text-sm">{label}</span>
            <Switch
              checked={field[key]}
              onCheckedChange={(checked) => onChange({ [key]: checked })}
            />
          </div>
        ))}
      </div>

      <Separator />

      <LabeledInput
        label="Плейсхолдер"
        value={field.placeholder ?? ""}
        onChange={(value) => onChange({ placeholder: value })}
      />

      <div className="space-y-2">
        <FormLabel>Подсказка</FormLabel>
        <Textarea
          value={field.helpText ?? ""}
          onChange={(event) => onChange({ helpText: event.target.value })}
        />
      </div>

      <Separator />

      <JsonEditor
        label="Default value (JSON)"
        value={defaultValueText}
        onChange={setDefaultValueText}
        onBlur={() =>
          handleJsonUpdate<FieldDefaultValue>(
            defaultValueText,
            "Default value",
            (parsed) => onChange({ defaultValue: parsed }),
          )
        }
      />

      <JsonEditor
        label="Options (JSON)"
        value={optionsText}
        onChange={setOptionsText}
        onBlur={() =>
          handleJsonUpdate<FieldOption[] | null>(
            optionsText,
            "Options",
            (parsed) => onChange({ options: parsed }),
          )
        }
      />

      <JsonEditor
        label="Validation (JSON)"
        value={validationText}
        onChange={setValidationText}
        onBlur={() =>
          handleJsonUpdate<FieldValidationMeta>(
            validationText,
            "Validation",
            (parsed) => onChange({ validation: parsed }),
          )
        }
      />
    </div>
  );
}

function FormLabel({ children }: { children: ReactNode }) {
  return (
    <div className="pt-2 text-sm font-medium text-muted-foreground">
      {children}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function JsonEditor({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      <Textarea
        className="min-h-[120px] font-mono text-xs"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}

function handleJsonUpdate<T>(
  text: string,
  label: string,
  apply: (value: T) => void,
) {
  try {
    apply(JSON.parse(text) as T);
  } catch {
    toast.error(`Некорректный JSON в поле: ${label}`);
  }
}

function toPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
