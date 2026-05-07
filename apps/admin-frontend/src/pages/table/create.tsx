import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type HttpError,
  useCreate,
  useInvalidate,
  useList,
  useNavigation,
  useNotification,
} from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import type {
  AdminFieldMeta,
  AdminTableMeta,
  CreateAdminFieldInput,
  CreateAdminTableInput,
  FieldDefaultValue,
  FieldOption,
  FieldRelationInput,
  FieldValidationMeta,
} from "@ommr/shared";
import {
  DEFAULT_FIELD_VALIDATION,
  FIELD_INPUT_TYPE_LABELS,
} from "@ommr/shared";
import {
  createTableSchema,
  type AdminTableFormValues,
} from "@ommr/shared/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CreateView,
  CreateViewHeader,
} from "@/components/refine-ui/views/create-view";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingBanner } from "@/components/LoadingBanner";
import { FieldInspector } from "@/components/FieldInspector";
import { TableInfoForm } from "@/components/form/TableInfoForm";
import { toCreateTablePayload } from "@/lib/table-form-mappers";
import { getErrorMessage, getFirstFormError } from "@/lib/errors";

type FieldDraft = Omit<CreateAdminFieldInput, "tableId"> & {
  tempId: string;
  defaultValueText: string;
  optionsText: string;
  validationText: string;
};

const NEW_TABLE_TEMP_ID = "__new_table__";

const DEFAULT_OPTIONS_JSON = "[]";
const DEFAULT_VALUE_JSON = "null";

const defaultTableValues: AdminTableFormValues = {
  name: "",
  label: "",
  description: null,

  status: "draft",
  source: "manual",
  icon: "table",

  group: null,
  groupName: null,
  showInMenu: true,

  canList: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
};

function createFieldDraft(index = 1): FieldDraft {
  return {
    tempId: crypto.randomUUID(),

    name: `new_field_${index}`,
    label: `Новое поле ${index}`,
    dbType: "",
    inputType: "text",

    required: false,
    editable: true,
    sortable: true,
    filterable: true,
    visible: true,

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
  const { open } = useNotification();

  const { query: tablesListData } = useList<AdminTableMeta>({
    resource: "tables",
    pagination: {
      mode: "off",
    },
    meta: {
      includeFields: true,
    },
  });

  const tablesData = tablesListData?.data?.data ?? [];

  const [fields, setFields] = useState<FieldDraft[]>([createFieldDraft(1)]);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(
    fields[0]?.tempId ?? null,
  );

  const tableForm = useForm<AdminTableMeta, HttpError, AdminTableFormValues>({
    resolver: zodResolver(createTableSchema),
    mode: "onChange",
    refineCoreProps: {
      resource: "tables",
      action: "create",
      redirect: false,
    },
    defaultValues: defaultTableValues,
  });

  const {
    handleSubmit,
    refineCore: { formLoading },
  } = tableForm;

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

  async function saveTable(values: AdminTableFormValues) {
    if (fields.length === 0) {
      open?.({
        type: "error",
        message: "Добавьте хотя бы одно поле",
      });
      return;
    }

    try {
      const createdTable = await createTableAsync(toCreateTablePayload(values));

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

          group: field.group ?? null,

          defaultValue,
          options,
          validation,

          placeholder: field.placeholder || null,
          helpText: field.helpText || null,

          relation: (field.relation ?? null) as FieldRelationInput | null,

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

      open?.({
        type: "success",
        message: "Таблица создана",
        description: `Создано полей: ${fields.length}`,
      });

      edit("tables", createdTable.id);
    } catch (error) {
      open?.({
        type: "error",
        message: "Не удалось создать таблицу",
        description: getErrorMessage(error, "Проверьте данные и попробуйте ещё раз"),
      });
    }
  }

  const handleSave = handleSubmit(saveTable, (errors) => {
    open?.({
      type: "error",
      message: "Форма заполнена некорректно",
      description: getFirstFormError(errors, "Проверьте обязательные поля формы"),
    });
  });

  return (
    <CreateView>
      <CreateViewHeader
        title="Создание таблицы"
        actionsSlot={
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Создание..." : "Создать таблицу"}
          </Button>
        }
      />

      {tablesListData.isLoading && <LoadingBanner />}

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
          <TableInfoForm
            mode="create"
            control={tableForm.control}
            register={tableForm.register}
            setValue={tableForm.setValue}
          />

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
                        ? "border-blue-200 bg-blue-50 shadow-[inset_4px_0_0_#2563eb]"
                        : "bg-background hover:bg-muted/40"
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <strong
                          className={
                            isActive ? "truncate text-primary" : "truncate"
                          }
                        >
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
