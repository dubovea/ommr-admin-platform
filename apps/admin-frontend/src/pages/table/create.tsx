import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import {
  type HttpError,
  useCreate,
  useInvalidate,
  useList,
  useNavigation,
} from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type {
  AdminFieldMeta,
  AdminTableActionKey,
  AdminTableMeta,
  CreateAdminFieldInput,
  CreateAdminTableInput,
  FieldDefaultValue,
  FieldOption,
  FieldRelationInput,
  FieldValidationMeta,
} from "@ommr/shared";
import {
  ADMIN_TABLE_SOURCE_LABELS,
  ADMIN_TABLE_SOURCES,
  ADMIN_TABLE_STATUS_LABELS,
  ADMIN_TABLE_STATUSES,
  DEFAULT_FIELD_VALIDATION,
  FIELD_INPUT_TYPE_LABELS,
} from "@ommr/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CreateView,
  CreateViewHeader,
} from "@/components/refine-ui/views/create-view";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingBanner } from "@/components/LoadingBanner";
import { FieldInspector } from "@/components/FieldInspector";

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
  defaultValueText: string;
  optionsText: string;
  validationText: string;
};

const NEW_TABLE_TEMP_ID = "__new_table__";
const DEFAULT_OPTIONS_JSON = "[]";
const DEFAULT_VALUE_JSON = "null";

function createFieldDraft(index = 1): FieldDraft {
  return {
    tempId: crypto.randomUUID(),

    name: `new_field_${index}`,
    label: `Новое поле ${index}`,
    dbType: "",
    inputType: "text",

    required: false,
    editable: false,
    sortable: false,
    filterable: false,
    visible: false,

    group: null,
    placeholder: null,
    helpText: null,
    relation: null,

    defaultValueText: DEFAULT_VALUE_JSON,
    optionsText: DEFAULT_OPTIONS_JSON,
    validationText: JSON.stringify(DEFAULT_FIELD_VALIDATION, null, 2),

    sortOrder: index,
  };
}

function parseJsonOrThrow<T>(text: string, label: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Некорректный JSON в поле "${label}"`);
  }
}

function draftToInspectorField(field: FieldDraft): AdminFieldMeta {
  return {
    id: field.tempId,
    tableId: NEW_TABLE_TEMP_ID,

    name: field.name,
    label: field.label,
    dbType: field.dbType,
    inputType: field.inputType,

    required: Boolean(field.required),
    editable: Boolean(field.editable),
    sortable: Boolean(field.sortable),
    filterable: Boolean(field.filterable),
    visible: Boolean(field.visible),

    group: field.group ?? null,
    defaultValue: null,
    options: null,
    validation: DEFAULT_FIELD_VALIDATION,
    placeholder: field.placeholder ?? null,
    helpText: field.helpText ?? null,

    /**
     * В create-режиме relation ещё может быть неполной:
     * например { targetTableId }.
     *
     * FieldInspector умеет работать с такой relation,
     * потому что backend потом достроит её до FieldRelationMeta.
     */
    relation: field.relation as AdminFieldMeta["relation"],

    sortOrder: field.sortOrder,
  };
}

function fieldPatchToDraftPatch(
  patch: Partial<CreateAdminFieldInput>,
): Partial<FieldDraft> {
  const draftPatch: Partial<FieldDraft> = {
    ...patch,
  };

  if ("relation" in patch) {
    draftPatch.relation = patch.relation ?? null;
  }

  return draftPatch;
}

export function TableCreatePage() {
  const invalidate = useInvalidate();
  const { edit } = useNavigation();

  const { query: tablesListData } = useList<AdminTableMeta>({
    resource: "tables",
    meta: {
      includeFields: true,
    },
  });

  const tablesData = tablesListData?.data?.data ?? [];

  const [fields, setFields] = useState<FieldDraft[]>([createFieldDraft(1)]);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(
    fields[0]?.tempId ?? null,
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    refineCore: { formLoading },
  } = useForm<AdminTableMeta, HttpError, TableCreateValues>({
    refineCoreProps: {
      resource: "tables",
      action: "create",
      redirect: false,
    },
    defaultValues: {
      name: "",
      label: "",
      description: "",
      icon: "table",
      status: "draft",
      source: "manual",
      canList: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    } as Partial<TableCreateValues>,
  });

  const { mutate: createTable, mutation: mutationTable } =
    useCreate<AdminTableMeta>();

  const { mutate: createField, mutation: mutationField } =
    useCreate<AdminFieldMeta>();

  const isCreatingTable = mutationTable.isPending;
  const isCreatingField = mutationField.isPending;
  const isSaving = formLoading || isCreatingTable || isCreatingField;

  const activeField =
    fields.find((field) => field.tempId === activeFieldId) ?? fields[0] ?? null;

  const activeInspectorField = activeField
    ? draftToInspectorField(activeField)
    : null;

  const createTableAsync = (values: CreateAdminTableInput) =>
    new Promise<AdminTableMeta>((resolve, reject) => {
      createTable(
        {
          resource: "tables",
          values,
        },
        {
          onSuccess: ({ data }) => resolve(data),
          onError: reject,
        },
      );
    });

  const createFieldAsync = (values: CreateAdminFieldInput) =>
    new Promise<AdminFieldMeta>((resolve, reject) => {
      createField(
        {
          resource: "fields",
          values,
        },
        {
          onSuccess: ({ data }) => resolve(data),
          onError: reject,
        },
      );
    });

  function patchField(tempId: string, patch: Partial<CreateAdminFieldInput>) {
    setFields((current) =>
      current.map((field) =>
        field.tempId === tempId
          ? {
              ...field,
              ...fieldPatchToDraftPatch(patch),
            }
          : field,
      ),
    );
  }

  function addField() {
    const next = createFieldDraft(fields.length + 1);

    setFields((current) => [
      ...current,
      {
        ...next,
        sortOrder: current.length + 1,
      },
    ]);

    setActiveFieldId(next.tempId);
  }

  function removeField(tempId: string) {
    setFields((current) => {
      const updated = current
        .filter((field) => field.tempId !== tempId)
        .map((field, index) => ({
          ...field,
          sortOrder: index + 1,
        }));

      if (activeFieldId === tempId) {
        setActiveFieldId(updated[0]?.tempId ?? null);
      }

      return updated;
    });
  }

  async function saveTable(values: TableCreateValues) {
    if (fields.length === 0) {
      toast.error("Добавьте хотя бы одно поле");
      return;
    }

    try {
      const createdTable = await createTableAsync({
        name: values.name,
        label: values.label,
        description: values.description || null,
        status: values.status,
        source: values.source,
        icon: values.icon || "table",
      });

      for (const [index, field] of fields.entries()) {
        if (!field.name.trim()) {
          throw new Error(`У поля ${index + 1} не заполнено имя`);
        }

        if (!field.label.trim()) {
          throw new Error(`У поля ${index + 1} не заполнен label`);
        }

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
          dbType: field.dbType?.trim() || "",
          inputType: field.inputType,

          required: Boolean(field.required),
          editable: Boolean(field.editable),
          sortable: Boolean(field.sortable),
          filterable: Boolean(field.filterable),
          visible: Boolean(field.visible),

          group: null,

          defaultValue,
          options,
          validation,

          placeholder: field.placeholder || null,
          helpText: field.helpText || null,

          /**
           * Relation может быть неполной.
           * Backend сам достроит targetTable/targetKey/displayField
           * и заполнит relationTargetTableId.
           */
          relation: field.relation ?? null,

          sortOrder: index + 1,
        });
      }

      await invalidate({
        resource: "tables",
        invalidates: ["list", "detail"],
      });

      await invalidate({
        resource: "fields",
        invalidates: ["list"],
      });

      edit("tables", createdTable.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка создания");
    }
  }

  return (
    <CreateView>
      <CreateViewHeader title="Создание таблицы" />

      {tablesListData.isLoading && <LoadingBanner />}

      <div className="flex justify-end">
        <Button onClick={handleSubmit(saveTable)} disabled={isSaving}>
          {isSaving ? "Создание..." : "Создать таблицу"}
        </Button>
      </div>

      <Card className="border-blue-200 bg-blue-50/40 shadow-none">
        <CardContent className="flex gap-4 p-4">
          <div className="grid size-7 place-items-center rounded-full border-2 border-blue-600 text-sm font-bold text-blue-600">
            i
          </div>

          <div>
            <div className="font-semibold">
              Создайте таблицу и сразу настройте её поля.
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Таблица и поля будут созданы через стандартные CRUD операции
              Refine.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="fields">
        <TabsList>
          <TabsTrigger value="general">Общее</TabsTrigger>
          <TabsTrigger value="fields">Поля</TabsTrigger>
          <TabsTrigger value="display">Отображение</TabsTrigger>
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
                <Input {...register("name")} />

                <FormLabel>Иконка</FormLabel>
                <Input {...register("icon")} />

                <FormLabel>Описание</FormLabel>
                <Textarea {...register("description")} />

                <FormLabel>Статус</FormLabel>
                <Select
                  value={watch("status")}
                  onValueChange={(value) =>
                    setValue("status", value as AdminTableMeta["status"])
                  }
                >
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

                <FormLabel>Источник</FormLabel>
                <Select
                  value={watch("source")}
                  onValueChange={(value) =>
                    setValue("source", value as AdminTableMeta["source"])
                  }
                >
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Доступные действия</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {(
                  [
                    ["canList", "Список"],
                    ["canCreate", "Создание"],
                    ["canEdit", "Редактирование"],
                    ["canDelete", "Удаление"],
                  ] satisfies Array<[AdminTableActionKey, string]>
                ).map(([key, label]) => (
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
                        />
                      </div>
                    )}
                  />
                ))}
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
                  <div
                    key={field.tempId}
                    role="button"
                    onClick={() => setActiveFieldId(field.tempId)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-blue-200 bg-blue-50"
                        : "bg-background hover:bg-muted/40"
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <strong className="truncate">
                          {field.label || field.name || `Поле ${index + 1}`}
                        </strong>

                        <span className="truncate text-xs text-muted-foreground">
                          {FIELD_INPUT_TYPE_LABELS[field.inputType]}
                        </span>
                      </div>

                      <div className="truncate text-xs text-muted-foreground">
                        {field.name || "Без имени"}
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
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <Card className="sticky top-24 h-fit">
          <CardContent>
            {activeField && activeInspectorField ? (
              <FieldInspector
                tablesData={tablesData}
                key={activeField.tempId}
                field={activeInspectorField}
                onChange={(patch) => patchField(activeField.tempId, patch)}
                onClose={() => setActiveFieldId(null)}
              />
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                Выберите поле
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CreateView>
  );
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2 text-sm font-medium text-muted-foreground">
      {children}
    </div>
  );
}
