import { useMemo, useState } from "react";
import { useCreate, useInvalidate, useNavigation } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type {
  AdminFieldMeta,
  AdminTableMeta,
  CreateAdminFieldInput,
  CreateAdminTableInput,
  FieldDefaultValue,
  FieldInputType,
  FieldOption,
  FieldRelationMeta,
  FieldValidationMeta,
} from "@ommr/shared";
import {
  DEFAULT_FIELD_VALIDATION,
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
import {
  CreateView,
  CreateViewHeader,
} from "@/components/refine-ui/views/create-view";

type TableCreateValues = CreateAdminTableInput & {
  canList: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  description: string;
  icon: string;
  status: AdminTableMeta["status"];
  source: AdminTableMeta["source"];
};

type FieldDraft = Omit<CreateAdminFieldInput, "tableId"> & {
  tempId: string;
  group: string;
  placeholder: string;
  helpText: string;
  relation: FieldRelationMeta | null;
  defaultValueText: string;
  optionsText: string;
  validationText: string;
};

const DEFAULT_OPTIONS_JSON = "[]";
const DEFAULT_VALUE_JSON = "null";

function createFieldDraft(): FieldDraft {
  return {
    tempId: crypto.randomUUID(),
    name: "",
    label: "",
    dbType: "str",
    inputType: "text",
    required: false,
    editable: true,
    sortable: false,
    filterable: false,
    visible: true,
    group: "",
    placeholder: "",
    helpText: "",
    relation: null,
    defaultValueText: DEFAULT_VALUE_JSON,
    optionsText: DEFAULT_OPTIONS_JSON,
    validationText: JSON.stringify(DEFAULT_FIELD_VALIDATION, null, 2),
    sortOrder: 1,
  };
}

function parseJsonOrThrow<T>(text: string, label: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Некорректный JSON в поле "${label}"`);
  }
}

function hasRelation(relation: FieldRelationMeta | null | undefined) {
  return Boolean(
    relation?.targetTable ||
      relation?.targetKey ||
      relation?.displayField ||
      relation?.additionalText,
  );
}

export function TableCreatePage() {
  const invalidate = useInvalidate();
  const { edit } = useNavigation();

  const [fields, setFields] = useState<FieldDraft[]>([createFieldDraft()]);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  const {
    register,
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

  const { mutate: createTable, isLoading: isCreatingTable } = useCreate<AdminTableMeta>();
  const { mutate: createField, isLoading: isCreatingField } = useCreate<AdminFieldMeta>();

  const activeField =
    fields.find((field) => field.tempId === activeFieldId) ?? fields[0] ?? null;

  const groupedPreview = useMemo(() => {
    return fields.reduce<Record<string, FieldDraft[]>>((acc, field) => {
      const groupName = field.group.trim() || "Без группы";
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(field);
      return acc;
    }, {});
  }, [fields]);

  const createTableAsync = (values: CreateAdminTableInput) =>
    new Promise<AdminTableMeta>((resolve, reject) => {
      createTable(
        { resource: "tables", values },
        {
          onSuccess: ({ data }) => resolve(data),
          onError: reject,
        },
      );
    });

  const createFieldAsync = (values: CreateAdminFieldInput) =>
    new Promise<AdminFieldMeta>((resolve, reject) => {
      createField(
        { resource: "fields", values },
        {
          onSuccess: ({ data }) => resolve(data),
          onError: reject,
        },
      );
    });

  function patchField(tempId: string, patch: Partial<FieldDraft>) {
    setFields((current) =>
      current.map((field) =>
        field.tempId === tempId ? { ...field, ...patch } : field,
      ),
    );
  }

  function patchRelation(tempId: string, patch: Partial<FieldRelationMeta>) {
    setFields((current) =>
      current.map((field) =>
        field.tempId === tempId
          ? {
              ...field,
              relation: {
                targetTable: field.relation?.targetTable ?? "",
                targetKey: field.relation?.targetKey ?? "",
                displayField: field.relation?.displayField ?? "",
                additionalText: field.relation?.additionalText ?? null,
                ...patch,
              },
            }
          : field,
      ),
    );
  }

  function addField() {
    const next = createFieldDraft();
    setFields((current) => {
      const updated = [...current, { ...next, sortOrder: current.length + 1 }];
      return updated;
    });
    setActiveFieldId(next.tempId);
  }

  function removeField(tempId: string) {
    setFields((current) =>
      current
        .filter((field) => field.tempId !== tempId)
        .map((field, index) => ({ ...field, sortOrder: index + 1 })),
    );

    if (activeFieldId === tempId) {
      const nextField = fields.find((field) => field.tempId !== tempId);
      setActiveFieldId(nextField?.tempId ?? null);
    }
  }

  async function onSubmit(values: TableCreateValues) {
    if (fields.length === 0) {
      toast.error("Добавьте хотя бы одно поле");
      return;
    }

    try {
      const createdTable = await createTableAsync({
        name: values.name,
        dbName: values.dbName,
        label: values.label,
        description: values.description || null,
        status: values.status,
        source: values.source,
        icon: values.icon || "table",
      });

      await Promise.all(
        fields.map(async (field, index) => {
          const defaultValue = parseJsonOrThrow<FieldDefaultValue>(
            field.defaultValueText || DEFAULT_VALUE_JSON,
            `Default value (${field.name || field.label || index + 1})`,
          );
          const options = parseJsonOrThrow<FieldOption[] | null>(
            field.optionsText || DEFAULT_OPTIONS_JSON,
            `Options (${field.name || field.label || index + 1})`,
          );
          const validation = parseJsonOrThrow<FieldValidationMeta>(
            field.validationText || JSON.stringify(DEFAULT_FIELD_VALIDATION),
            `Validation (${field.name || field.label || index + 1})`,
          );

          await createFieldAsync({
            tableId: createdTable.id,
            name: field.name.trim(),
            label: field.label.trim(),
            dbType: field.dbType.trim() || "str",
            inputType: field.inputType,
            required: field.required,
            editable: field.editable,
            sortable: field.sortable,
            filterable: field.filterable,
            visible: field.visible,
            group: field.group.trim() || null,
            defaultValue,
            options,
            validation,
            placeholder: field.placeholder || null,
            helpText: field.helpText || null,
            relation: hasRelation(field.relation) ? field.relation : null,
            sortOrder: index + 1,
          });
        }),
      );

      await invalidate({ resource: "tables", invalidates: ["list"] });
      await invalidate({ resource: "fields", invalidates: ["list"] });

      toast.success("Таблица и поля успешно созданы");
      edit("tables", createdTable.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не удалось создать таблицу",
      );
    }
  }

  const isSaving = isCreatingTable || isCreatingField;

  return (
    <CreateView>
      <CreateViewHeader title="Создание таблицы" />

      <div className="flex justify-end">
        <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
          {isSaving ? "Создание..." : "Создать таблицу"}
        </Button>
      </div>

      <Card className="border-blue-200 bg-blue-50/40 shadow-none">
        <CardContent className="flex gap-4 p-4">
          <div className="grid size-7 place-items-center rounded-full border-2 border-blue-600 text-sm font-bold text-blue-600">
            i
          </div>
          <div>
            <div className="font-semibold">Создайте таблицу и сразу настройте её поля.</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Таблица и поля будут созданы через стандартные CRUD операции Refine.
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
                <SwitchRow label="Список" checked={watch("canList")} onCheckedChange={(checked) => setValue("canList", checked)} />
                <SwitchRow label="Создание" checked={watch("canCreate")} onCheckedChange={(checked) => setValue("canCreate", checked)} />
                <SwitchRow label="Редактирование" checked={watch("canEdit")} onCheckedChange={(checked) => setValue("canEdit", checked)} />
                <SwitchRow label="Удаление" checked={watch("canDelete")} onCheckedChange={(checked) => setValue("canDelete", checked)} />

                <Separator />

                <div className="space-y-2">
                  <FormLabel>Статус</FormLabel>
                  <Select value={watch("status")} onValueChange={(value) => setValue("status", value as AdminTableMeta["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Черновик</SelectItem>
                      <SelectItem value="needs_setup">Нужно настроить</SelectItem>
                      <SelectItem value="partial">Частично</SelectItem>
                      <SelectItem value="ready">Готово</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <FormLabel>Источник</FormLabel>
                  <Select value={watch("source")} onValueChange={(value) => setValue("source", value as AdminTableMeta["source"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle>Поля таблицы</CardTitle>
              <Button variant="outline" onClick={addField}>
                <Plus className="size-4" />
                Добавить поле
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((field, index) => {
                const isActive = field.tempId === activeField?.tempId;
                return (
                  <button
                    key={field.tempId}
                    type="button"
                    onClick={() => setActiveFieldId(field.tempId)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                      isActive ? "border-blue-200 bg-blue-50" : "bg-background hover:bg-muted/40"
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <strong className="truncate">{field.label || field.name || `Поле ${index + 1}`}</strong>
                        <span className="truncate text-xs text-muted-foreground">{FIELD_INPUT_TYPE_LABELS[field.inputType]}</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{field.name || "Без имени"}</div>
                      <div className="truncate text-xs text-muted-foreground">Группа: {field.group || "Без группы"}</div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); removeField(field.tempId); }}>
                      <Trash2 className="size-4" />
                    </Button>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Предпросмотр группировки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(groupedPreview).map(([groupName, items]) => (
                <div key={groupName} className="rounded-lg border p-4">
                  <div className="mb-2 font-medium">{groupName}</div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <div key={item.tempId} className="rounded-md bg-muted px-2 py-1 text-xs">
                        {item.label || item.name || "Без имени"}
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
          <CardContent className="p-5">
            {activeField ? (
              <FieldInspector
                field={activeField}
                onChange={(patch) => patchField(activeField.tempId, patch)}
                onRelationChange={(patch) => patchRelation(activeField.tempId, patch)}
              />
            ) : (
              <div className="py-10 text-center text-muted-foreground">Выберите поле</div>
            )}
          </CardContent>
        </Card>
      </div>
    </CreateView>
  );
}

function FieldInspector({
  field,
  onChange,
  onRelationChange,
}: {
  field: FieldDraft;
  onChange: (patch: Partial<FieldDraft>) => void;
  onRelationChange: (patch: Partial<FieldRelationMeta>) => void;
}) {
  const relationEnabled =
    field.inputType === "select" || field.inputType === "multiselect" || hasRelation(field.relation);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FormLabel>Имя поля *</FormLabel>
        <Input value={field.name} onChange={(event) => onChange({ name: event.target.value })} />
      </div>

      <div className="space-y-2">
        <FormLabel>Label *</FormLabel>
        <Input value={field.label} onChange={(event) => onChange({ label: event.target.value })} />
      </div>

      <div className="space-y-2">
        <FormLabel>Группа</FormLabel>
        <Input value={field.group} onChange={(event) => onChange({ group: event.target.value })} />
      </div>

      <div className="space-y-2">
        <FormLabel>DB type</FormLabel>
        <Input value={field.dbType} onChange={(event) => onChange({ dbType: event.target.value })} />
      </div>

      <div className="space-y-2">
        <FormLabel>Тип поля</FormLabel>
        <Select
          value={field.inputType}
          onValueChange={(value) =>
            onChange({
              inputType: value as FieldInputType,
              relation:
                value === "select" || value === "multiselect"
                  ? field.relation ?? {
                      targetTable: "",
                      targetKey: "id",
                      displayField: "name",
                      additionalText: null,
                    }
                  : field.relation,
            })
          }
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {FIELD_INPUT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{FIELD_INPUT_TYPE_LABELS[type]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <SwitchRow label="Обязательное" checked={field.required} onCheckedChange={(checked) => onChange({ required: checked })} />
      <SwitchRow label="Редактируемое" checked={field.editable} onCheckedChange={(checked) => onChange({ editable: checked })} />
      <SwitchRow label="Сортируемое" checked={field.sortable} onCheckedChange={(checked) => onChange({ sortable: checked })} />
      <SwitchRow label="Фильтруемое" checked={field.filterable} onCheckedChange={(checked) => onChange({ filterable: checked })} />
      <SwitchRow label="Видимое" checked={field.visible} onCheckedChange={(checked) => onChange({ visible: checked })} />

      <Separator />

      <div className="space-y-2">
        <FormLabel>Placeholder</FormLabel>
        <Input value={field.placeholder} onChange={(event) => onChange({ placeholder: event.target.value })} />
      </div>

      <div className="space-y-2">
        <FormLabel>Help text</FormLabel>
        <Textarea value={field.helpText} onChange={(event) => onChange({ helpText: event.target.value })} />
      </div>

      <div className="space-y-2">
        <FormLabel>Default value (JSON)</FormLabel>
        <Textarea className="min-h-[120px] font-mono text-xs" value={field.defaultValueText} onChange={(event) => onChange({ defaultValueText: event.target.value })} />
      </div>

      <div className="space-y-2">
        <FormLabel>Options (JSON)</FormLabel>
        <Textarea className="min-h-[140px] font-mono text-xs" value={field.optionsText} onChange={(event) => onChange({ optionsText: event.target.value })} />
      </div>

      <div className="space-y-2">
        <FormLabel>Validation (JSON)</FormLabel>
        <Textarea className="min-h-[160px] font-mono text-xs" value={field.validationText} onChange={(event) => onChange({ validationText: event.target.value })} />
      </div>

      {relationEnabled ? (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="text-sm font-semibold">Настройки relation</div>
            <div className="space-y-2">
              <FormLabel>Target table</FormLabel>
              <Input value={field.relation?.targetTable ?? ""} onChange={(event) => onRelationChange({ targetTable: event.target.value })} />
            </div>
            <div className="space-y-2">
              <FormLabel>Target key</FormLabel>
              <Input value={field.relation?.targetKey ?? ""} onChange={(event) => onRelationChange({ targetKey: event.target.value })} />
            </div>
            <div className="space-y-2">
              <FormLabel>Display field</FormLabel>
              <Input value={field.relation?.displayField ?? ""} onChange={(event) => onRelationChange({ displayField: event.target.value })} />
            </div>
            <div className="space-y-2">
              <FormLabel>Additional text</FormLabel>
              <Input value={field.relation?.additionalText ?? ""} onChange={(event) => onRelationChange({ additionalText: event.target.value || null })} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-muted-foreground">{children}</div>;
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
