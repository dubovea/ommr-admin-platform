import { useMemo, useState } from "react";
import { useCreate, useInvalidate, useNavigation } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type {
  AdminFieldMeta,
  AdminTableMeta,
  FieldInputType,
} from "@ommr/shared";
import {
  FIELD_INPUT_TYPE_LABELS,
  FIELD_INPUT_TYPES,
} from "@ommr/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type TableCreateValues = {
  name: string;
  dbName: string;
  label: string;
  description: string;
  status: AdminTableMeta["status"];
  source: AdminTableMeta["source"];
  icon: string;
  canList: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

type RelationDraft = {
  targetTable: string;
  targetKey: string;
  displayField: string;
  additionalText: string;
};

type FieldDraft = {
  tempId: string;
  name: string;
  label: string;
  group: string;
  dbType: string;
  inputType: FieldInputType;

  required: boolean;
  editable: boolean;
  sortable: boolean;
  filterable: boolean;
  visible: boolean;

  placeholder: string;
  helpText: string;

  defaultValueText: string;
  optionsText: string;
  validationText: string;

  relation: RelationDraft;
};

const DEFAULT_VALIDATION_JSON = `{
  "min": null,
  "max": null,
  "minLength": null,
  "maxLength": null,
  "pattern": ""
}`;

const DEFAULT_OPTIONS_JSON = `[]`;

const DEFAULT_VALUE_JSON = `null`;

function createEmptyFieldDraft(): FieldDraft {
  return {
    tempId: crypto.randomUUID(),
    name: "",
    label: "",
    group: "",
    dbType: "String",
    inputType: "text",

    required: false,
    editable: true,
    sortable: false,
    filterable: false,
    visible: true,

    placeholder: "",
    helpText: "",

    defaultValueText: DEFAULT_VALUE_JSON,
    optionsText: DEFAULT_OPTIONS_JSON,
    validationText: DEFAULT_VALIDATION_JSON,

    relation: {
      targetTable: "",
      targetKey: "",
      displayField: "",
      additionalText: "",
    },
  };
}

function parseJsonOrThrow(text: string, label: string) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Некорректный JSON в блоке "${label}"`);
  }
}

function hasRelation(relation: RelationDraft) {
  return Boolean(
    relation.targetTable.trim() ||
      relation.targetKey.trim() ||
      relation.displayField.trim() ||
      relation.additionalText.trim(),
  );
}

export function TableCreatePage() {
  const { edit } = useNavigation();
  const invalidate = useInvalidate();

  const [fields, setFields] = useState<FieldDraft[]>([createEmptyFieldDraft()]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
  } = useForm<TableCreateValues>({
    defaultValues: {
      name: "",
      dbName: "",
      label: "",
      description: "",
      status: "draft",
      source: "manual",
      icon: "table",
      canList: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
  });

  const { mutateAsync: createTable, mutation: createTableMutation } =
    useCreate<AdminTableMeta>();
  const { mutateAsync: createField, mutation: createFieldMutation } =
    useCreate<AdminFieldMeta>();

  const isSaving =
    createTableMutation.isPending || createFieldMutation.isPending;

  const selectedField =
    fields.find((field) => field.tempId === selectedFieldId) ?? fields[0] ?? null;

  const groupedPreview = useMemo(() => {
    return fields.reduce<Record<string, FieldDraft[]>>((acc, field) => {
      const key = field.group.trim() || "Без группы";
      if (!acc[key]) acc[key] = [];
      acc[key].push(field);
      return acc;
    }, {});
  }, [fields]);

  function addField() {
    const next = createEmptyFieldDraft();
    setFields((prev) => [...prev, next]);
    setSelectedFieldId(next.tempId);
  }

  function removeField(tempId: string) {
    setFields((prev) => prev.filter((field) => field.tempId !== tempId));

    setSelectedFieldId((current) => {
      if (current !== tempId) return current;

      const nextFields = fields.filter((field) => field.tempId !== tempId);
      return nextFields[0]?.tempId ?? null;
    });
  }

  function patchField(tempId: string, patch: Partial<FieldDraft>) {
    setFields((prev) =>
      prev.map((field) =>
        field.tempId === tempId ? { ...field, ...patch } : field,
      ),
    );
  }

  function patchRelation(tempId: string, patch: Partial<RelationDraft>) {
    setFields((prev) =>
      prev.map((field) =>
        field.tempId === tempId
          ? {
              ...field,
              relation: {
                ...field.relation,
                ...patch,
              },
            }
          : field,
      ),
    );
  }

  async function onSubmit(values: TableCreateValues) {
    if (fields.length === 0) {
      toast.error("Добавьте хотя бы одно поле");
      return;
    }

    for (const field of fields) {
      if (!field.name.trim()) {
        toast.error("У одного из полей не заполнено имя");
        return;
      }

      if (!field.label.trim()) {
        toast.error(`У поля "${field.name || "без имени"}" не заполнен label`);
        return;
      }
    }

    try {
      const createdTable = await createTable({
        resource: "tables",
        values: {
          ...values,
          description: values.description || null,
          icon: values.icon || "table",
        },
      });

      const tableId = createdTable.data.id;

      for (let index = 0; index < fields.length; index += 1) {
        const field = fields[index];

        const defaultValue = parseJsonOrThrow(
          field.defaultValueText || DEFAULT_VALUE_JSON,
          `defaultValue (${field.name})`,
        );

        const options = parseJsonOrThrow(
          field.optionsText || DEFAULT_OPTIONS_JSON,
          `options (${field.name})`,
        );

        const validation = parseJsonOrThrow(
          field.validationText || DEFAULT_VALIDATION_JSON,
          `validation (${field.name})`,
        );

        await createField({
          resource: "fields",
          values: {
            tableId,
            name: field.name.trim(),
            label: field.label.trim(),
            group: field.group.trim() || null,
            dbType: field.dbType.trim() || "String",
            inputType: field.inputType,

            required: field.required,
            editable: field.editable,
            sortable: field.sortable,
            filterable: field.filterable,
            visible: field.visible,

            placeholder: field.placeholder || null,
            helpText: field.helpText || null,

            defaultValue,
            options,
            validation,

            relation: hasRelation(field.relation)
              ? {
                  targetTable: field.relation.targetTable.trim(),
                  targetKey: field.relation.targetKey.trim(),
                  displayField: field.relation.displayField.trim(),
                  additionalText: field.relation.additionalText.trim() || null,
                }
              : null,

            sortOrder: index + 1,
          },
        });
      }

      toast.success("Таблица и поля успешно созданы");

      await invalidate({
        resource: "tables",
        invalidates: ["list"],
      });

      await invalidate({
        resource: "fields",
        invalidates: ["list"],
      });

      edit("tables", tableId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не удалось создать таблицу",
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 text-sm text-muted-foreground">
            Таблицы / Создание таблицы
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Создание таблицы
          </h1>
        </div>

        <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
          {isSaving ? "Сохранение..." : "Создать таблицу"}
        </Button>
      </div>

      <Card className="border-blue-200 bg-blue-50/40 shadow-none">
        <CardContent className="flex gap-4 p-4">
          <div className="grid size-7 place-items-center rounded-full border-2 border-blue-600 text-sm font-bold text-blue-600">
            i
          </div>
          <div>
            <div className="font-semibold">
              Здесь можно создать таблицу и сразу описать все поля.
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Поля будут созданы после создания таблицы через стандартные CRUD
              операции Refine.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="fields">
        <TabsList>
          <TabsTrigger value="general">Общее</TabsTrigger>
          <TabsTrigger value="fields">Поля</TabsTrigger>
          <TabsTrigger value="grouping">Группировка</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
        <section className="space-y-5">
          <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-[180px_1fr] gap-3">
                <FormLabel>Отображаемое имя *</FormLabel>
                <Input {...register("label")} />

                <FormLabel>Имя таблицы в БД *</FormLabel>
                <Input {...register("dbName")} />

                <FormLabel>Ключ ресурса *</FormLabel>
                <Input {...register("name")} />

                <FormLabel>Иконка</FormLabel>
                <Input {...register("icon")} />

                <FormLabel>Описание</FormLabel>
                <Textarea {...register("description")} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Доступные действия</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <SwitchRow
                  label="Список"
                  checked={watch("canList")}
                  onCheckedChange={(checked) => setValue("canList", checked)}
                />
                <SwitchRow
                  label="Создание"
                  checked={watch("canCreate")}
                  onCheckedChange={(checked) => setValue("canCreate", checked)}
                />
                <SwitchRow
                  label="Редактирование"
                  checked={watch("canEdit")}
                  onCheckedChange={(checked) => setValue("canEdit", checked)}
                />
                <SwitchRow
                  label="Удаление"
                  checked={watch("canDelete")}
                  onCheckedChange={(checked) => setValue("canDelete", checked)}
                />

                <Separator />

                <div className="space-y-2">
                  <FormLabel>Статус</FormLabel>
                  <Select
                    value={watch("status")}
                    onValueChange={(value) =>
                      setValue("status", value as AdminTableMeta["status"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Черновик</SelectItem>
                      <SelectItem value="needs_setup">
                        Нужно настроить
                      </SelectItem>
                      <SelectItem value="partial">Частично</SelectItem>
                      <SelectItem value="ready">Готово</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <FormLabel>Источник</FormLabel>
                  <Select
                    value={watch("source")}
                    onValueChange={(value) =>
                      setValue("source", value as AdminTableMeta["source"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Ручное создание</SelectItem>
                      <SelectItem value="pydantic">Pydantic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Поля таблицы</CardTitle>

              <Button variant="outline" onClick={addField}>
                <Plus className="size-4" />
                Добавить поле
              </Button>
            </CardHeader>

            <CardContent className="space-y-3">
              {fields.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Пока нет полей
                </div>
              ) : (
                fields.map((field, index) => {
                  const isSelected = selectedField?.tempId === field.tempId;

                  return (
                    <button
                      key={field.tempId}
                      type="button"
                      onClick={() => setSelectedFieldId(field.tempId)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-blue-200 bg-blue-50"
                          : "bg-background hover:bg-muted/40"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong>{field.name || `field_${index + 1}`}</strong>
                          <span className="text-xs text-muted-foreground">
                            {FIELD_INPUT_TYPE_LABELS[field.inputType]}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {field.label || "Без label"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Группа: {field.group || "Без группы"}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeField(field.tempId);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Группировка полей</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(groupedPreview).map(([groupName, groupFields]) => (
                <div key={groupName} className="rounded-lg border p-4">
                  <div className="mb-3 font-medium">{groupName}</div>
                  <div className="flex flex-wrap gap-2">
                    {groupFields.map((field) => (
                      <div
                        key={field.tempId}
                        className="rounded-md bg-muted px-2 py-1 text-xs"
                      >
                        {field.label || field.name || "Без имени"}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card className="sticky top-24 h-fit">
          <CardHeader>
            <CardTitle>Настройки поля</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {selectedField ? (
              <FieldInspector
                field={selectedField}
                onChange={(patch) => patchField(selectedField.tempId, patch)}
                onRelationChange={(patch) =>
                  patchRelation(selectedField.tempId, patch)
                }
              />
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Выберите поле
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FieldInspector({
  field,
  onChange,
  onRelationChange,
}: {
  field: FieldDraft;
  onChange: (patch: Partial<FieldDraft>) => void;
  onRelationChange: (patch: Partial<RelationDraft>) => void;
}) {
  const relationEnabled =
    field.inputType === "select" ||
    field.inputType === "multiselect" ||
    hasRelation(field.relation);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FormLabel>Имя поля *</FormLabel>
        <Input
          value={field.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>Label *</FormLabel>
        <Input
          value={field.label}
          onChange={(event) => onChange({ label: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>Группа</FormLabel>
        <Input
          value={field.group}
          onChange={(event) => onChange({ group: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>DB type</FormLabel>
        <Input
          value={field.dbType}
          onChange={(event) => onChange({ dbType: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>Тип поля</FormLabel>
        <Select
          value={field.inputType}
          onValueChange={(value) =>
            onChange({ inputType: value as FieldInputType })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_INPUT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {FIELD_INPUT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <SwitchRow
        label="Обязательное"
        checked={field.required}
        onCheckedChange={(checked) => onChange({ required: checked })}
      />
      <SwitchRow
        label="Редактируемое"
        checked={field.editable}
        onCheckedChange={(checked) => onChange({ editable: checked })}
      />
      <SwitchRow
        label="Сортируемое"
        checked={field.sortable}
        onCheckedChange={(checked) => onChange({ sortable: checked })}
      />
      <SwitchRow
        label="Фильтруемое"
        checked={field.filterable}
        onCheckedChange={(checked) => onChange({ filterable: checked })}
      />
      <SwitchRow
        label="Видимое"
        checked={field.visible}
        onCheckedChange={(checked) => onChange({ visible: checked })}
      />

      <Separator />

      <div className="space-y-2">
        <FormLabel>Placeholder</FormLabel>
        <Input
          value={field.placeholder}
          onChange={(event) => onChange({ placeholder: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>Help text</FormLabel>
        <Textarea
          value={field.helpText}
          onChange={(event) => onChange({ helpText: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>Default value (JSON)</FormLabel>
        <Textarea
          className="min-h-[120px] font-mono text-xs"
          value={field.defaultValueText}
          onChange={(event) =>
            onChange({ defaultValueText: event.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <FormLabel>Options (JSON)</FormLabel>
        <Textarea
          className="min-h-[140px] font-mono text-xs"
          value={field.optionsText}
          onChange={(event) => onChange({ optionsText: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>Validation (JSON)</FormLabel>
        <Textarea
          className="min-h-[160px] font-mono text-xs"
          value={field.validationText}
          onChange={(event) =>
            onChange({ validationText: event.target.value })
          }
        />
      </div>

      {relationEnabled ? (
        <>
          <Separator />

          <div className="space-y-3">
            <div className="text-sm font-semibold">Настройки relation</div>

            <div className="space-y-2">
              <FormLabel>Target table</FormLabel>
              <Input
                value={field.relation.targetTable}
                onChange={(event) =>
                  onRelationChange({ targetTable: event.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Target key</FormLabel>
              <Input
                value={field.relation.targetKey}
                onChange={(event) =>
                  onRelationChange({ targetKey: event.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Display field</FormLabel>
              <Input
                value={field.relation.displayField}
                onChange={(event) =>
                  onRelationChange({ displayField: event.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Additional text</FormLabel>
              <Input
                value={field.relation.additionalText}
                onChange={(event) =>
                  onRelationChange({ additionalText: event.target.value })
                }
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-medium text-muted-foreground">{children}</div>
  );
}

function SwitchRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}