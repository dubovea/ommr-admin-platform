
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type HttpError,
  useDeleteMany,
  useInvalidate,
  useList,
  useUpdate,
} from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { useTable } from "@refinedev/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { Link2, Pencil, Trash2, Upload, X } from "lucide-react";
import { useParams } from "react-router";

import {
  DEFAULT_FIELD_VALIDATION,
  FIELD_INPUT_TYPE_LABELS,
  FIELD_INPUT_TYPES,
  type AdminFieldFlagKey,
  type AdminFieldMeta,
  type AdminTableActionKey,
  type AdminTableMeta,
  type FieldOption,
  type FieldRelationMeta,
  type FieldValidationMeta,
  type UpdateAdminFieldInput,
  type UpdateAdminTableInput,
} from "@ommr/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import {
  EditView,
  EditViewHeader,
} from "@/components/refine-ui/views/edit-view";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTableSelection } from "@/hooks/use-table-selection";
import {
  getSelectionCheckboxState,
  SELECTION_COLUMN_SIZE,
  TableSelectionCheckBox,
} from "@/components/TableSelectionCheckBox";
import { pluralizeRu } from "@/lib/ru-plural";
import { DeleteItemsDialog } from "@/components/DeleteItemsDialog";
import { DeleteItemsToolbar } from "@/components/DeleteItemsToolbar";

export function TableEditPage() {
  const { id } = useParams<{ id: string }>();
  const invalidate = useInvalidate();

  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [fieldIdsToDelete, setFieldIdsToDelete] = useState<string[]>([]);

  const {
    rowSelection: fieldRowSelection,
    setRowSelection: setFieldRowSelection,
    selectedIds: selectedFieldIds,
    selectedCount: selectedFieldsCount,
    hasSelectedRows: hasSelectedFields,
    removeSelectedIds: removeSelectedFieldIds,
  } = useTableSelection();

  const {
    data: tablesData,
  } = useList<AdminTableMeta>({
    resource: "tables",
    pagination: {
      mode: "off",
    },
    queryOptions: {
      staleTime: 60_000,
    },
  });

  const tableNames = useMemo(
    () =>
      (tablesData?.data ?? [])
        .map((table) => table.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "ru")),
    [tablesData?.data],
  );

  const {
    register,
    control,
    handleSubmit,
    refineCore: { onFinish, formLoading },
  } = useForm<AdminTableMeta, HttpError, UpdateAdminTableInput>({
    refineCoreProps: {
      resource: "tables",
      id,
      action: "edit",
      redirect: false,
      queryOptions: {
        enabled: Boolean(id),
      },
      onMutationSuccess: () => toast.success("Таблица сохранена"),
    },
  });

  const { mutate: updateField } = useUpdate<AdminFieldMeta>();
  const { mutate: deleteFields, isLoading: isDeletingFields } =
    useDeleteMany<AdminFieldMeta>();

  const openDeleteFieldsDialog = useCallback((ids: string[]) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))];

    if (uniqueIds.length === 0) return;

    setFieldIdsToDelete(uniqueIds);
    setIsDeleteDialogOpen(true);
  }, []);

  const fieldColumns = useMemo<ColumnDef<AdminFieldMeta>[]>(
    () => [
      {
        id: "select",
        size: SELECTION_COLUMN_SIZE,
        minSize: SELECTION_COLUMN_SIZE,
        maxSize: SELECTION_COLUMN_SIZE,
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <TableSelectionCheckBox
            checked={getSelectionCheckboxState(
              table.getIsAllPageRowsSelected(),
              table.getIsSomePageRowsSelected(),
            )}
            onCheckedChange={(checked) => {
              table.toggleAllPageRowsSelected(checked === true);
            }}
            ariaLabel="Выбрать все поля"
          />
        ),
        cell: ({ row }) => (
          <div onClick={(event) => event.stopPropagation()}>
            <TableSelectionCheckBox
              checked={row.getIsSelected()}
              onCheckedChange={(checked) => {
                row.toggleSelected(checked === true);
              }}
              ariaLabel="Выбрать поле"
            />
          </div>
        ),
      },
      {
        id: "name",
        accessorKey: "name",
        header: "Поле",
        cell: ({ row }) => {
          const isActive = activeFieldId === row.original.id;
          const fieldLabel = row.original.label || row.original.name;

          return (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">⋮⋮</span>

              {row.original.relation ? (
                <Link2 className="size-4 shrink-0 text-violet-600" />
              ) : null}

              <button
                type="button"
                className={
                  isActive
                    ? "min-w-0 text-left font-semibold text-primary"
                    : "min-w-0 text-left font-semibold hover:text-primary"
                }
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveFieldId(row.original.id);
                }}
              >
                <span className="block truncate">{fieldLabel}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {row.original.name}
                </span>
              </button>
            </div>
          );
        },
      },
      {
        id: "group",
        accessorKey: "group",
        header: "Группа",
        cell: ({ row }) => (
          row.original.group ? (
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              {row.original.group}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )
        ),
      },
      {
        id: "inputType",
        accessorKey: "inputType",
        header: "Тип поля",
        cell: ({ row }) => FIELD_INPUT_TYPE_LABELS[row.original.inputType],
      },
      {
        id: "required",
        accessorKey: "required",
        header: "Обязательное",
        cell: ({ row }) => (
          <Checkbox checked={row.original.required} disabled />
        ),
      },
      {
        id: "editable",
        accessorKey: "editable",
        header: "Редактируемое",
        cell: ({ row }) => (
          <Checkbox checked={row.original.editable} disabled />
        ),
      },
      {
        id: "sortable",
        accessorKey: "sortable",
        header: "Сортировка",
        cell: ({ row }) => (
          <Checkbox checked={row.original.sortable} disabled />
        ),
      },
      {
        id: "filterable",
        accessorKey: "filterable",
        header: "Фильтр",
        cell: ({ row }) => (
          <Checkbox checked={row.original.filterable} disabled />
        ),
      },
      {
        id: "visible",
        accessorKey: "visible",
        header: "Видимость",
        cell: ({ row }) => (
          <Checkbox checked={row.original.visible} disabled />
        ),
      },
      {
        id: "actions",
        header: "Действия",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div
            className="flex items-center gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => setActiveFieldId(row.original.id)}
            >
              <Pencil className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => openDeleteFieldsDialog([row.original.id])}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [activeFieldId, openDeleteFieldsDialog],
  );

  const fieldsTable = useTable<AdminFieldMeta>({
    columns: fieldColumns,
    getRowId: (row) => row.id,
    enableMultiRowSelection: true,
    state: {
      rowSelection: fieldRowSelection,
    },
    onRowSelectionChange: setFieldRowSelection,
    refineCoreProps: {
      resource: "fields",
      filters: {
        permanent: [{ field: "tableId", operator: "eq", value: id }],
      },
      queryOptions: {
        enabled: Boolean(id),
      },
      pagination: {
        mode: "off",
      },
    },
  });

  const reactFieldsTable = fieldsTable.reactTable;
  const fieldRows = reactFieldsTable.getRowModel().rows;

  const selectedField =
    fieldRows.find((row) => row.id === activeFieldId)?.original ?? null;

  const fieldsToDelete = useMemo(
    () => fieldRows.filter((row) => fieldIdsToDelete.includes(row.id)),
    [fieldRows, fieldIdsToDelete],
  );

  useEffect(() => {
    if (fieldRows.length === 0) {
      setActiveFieldId(null);
      return;
    }

    if (activeFieldId && fieldRows.some((row) => row.id === activeFieldId)) {
      return;
    }

    const userIdRow = fieldRows.find((row) => row.original.name === "user_id");
    const rowToActivate = userIdRow ?? fieldRows[0];

    setActiveFieldId(rowToActivate.id);
  }, [fieldRows, activeFieldId]);

  function saveTable(values: AdminTableMeta) {
    const payload: UpdateAdminTableInput = {
      label: values.label,
      dbName: values.dbName,
      name: values.name,
      description: values.description,
      canList: values.canList,
      canCreate: values.canCreate,
      canEdit: values.canEdit,
      canDelete: values.canDelete,
      status: values.status,
    };

    void onFinish(payload);
  }

  function patchSelectedField(payload: UpdateAdminFieldInput) {
    if (!selectedField) return;

    updateField(
      {
        resource: "fields",
        id: selectedField.id,
        values: payload,
        mutationMode: "optimistic",
      },
      {
        onSuccess: () =>
          invalidate({
            resource: "fields",
            invalidates: ["list"],
          }),
      },
    );
  }

  const confirmDeleteFields = useCallback(() => {
    if (fieldIdsToDelete.length === 0) return;

    deleteFields(
      {
        resource: "fields",
        ids: fieldIdsToDelete,
      },
      {
        onSuccess: () => {
          toast.success(
            fieldIdsToDelete.length === 1
              ? "Поле удалено"
              : `Поля удалены: ${fieldIdsToDelete.length}`,
          );

          removeSelectedFieldIds(fieldIdsToDelete);

          if (activeFieldId && fieldIdsToDelete.includes(activeFieldId)) {
            const nextActiveField = fieldRows.find(
              (row) => !fieldIdsToDelete.includes(row.id),
            );

            setActiveFieldId(nextActiveField?.id ?? null);
          }

          setFieldIdsToDelete([]);
          setIsDeleteDialogOpen(false);

          invalidate({
            resource: "fields",
            invalidates: ["list"],
          });
        },
      },
    );
  }, [
    activeFieldId,
    deleteFields,
    fieldIdsToDelete,
    fieldRows,
    invalidate,
    removeSelectedFieldIds,
  ]);

  return (
    <EditView>
      <EditViewHeader
        title="Редактирование таблицы"
        onSave={handleSubmit(saveTable)}
        saving={formLoading}
      />

      <Card className="border-blue-200 bg-blue-50/40 shadow-none">
        <CardContent className="flex gap-4 p-4">
          <div className="grid size-7 place-items-center rounded-full border-2 border-blue-600 text-sm font-bold text-blue-600">
            i
          </div>

          <div>
            <div className="font-semibold">
              Импортирована только базовая информация из Pydantic.
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Настройте остальные параметры таблицы и отображения на этой
              странице.
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
                <Input {...register("dbName")} />

                <FormLabel>Ключ ресурса *</FormLabel>
                <Input {...register("name")} />

                <FormLabel>Описание</FormLabel>
                <Textarea {...register("description")} />
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

              <div className="flex flex-wrap items-center justify-end gap-2">
                <DeleteItemsToolbar
                  selectedCount={selectedFieldsCount}
                  deleteDisabled={!hasSelectedFields || isDeletingFields}
                  onDeleteClick={() => openDeleteFieldsDialog(selectedFieldIds)}
                />

                <Button variant="outline">+ Добавить поле</Button>

                <Button variant="outline">
                  <Upload className="size-4" />
                  Импортировать поля
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <DataTable
                table={fieldsTable as any}
                onRowClick={(row) => setActiveFieldId(row.id)}
              />
            </CardContent>
          </Card>
        </section>

        <Card className="sticky top-24 h-fit">
          <CardContent className="p-5">
            {selectedField ? (
              <FieldInspector
                key={selectedField.id}
                field={selectedField}
                tableNames={tableNames}
                onChange={patchSelectedField}
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

      <DeleteItemsDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Удалить выбранные поля?"
        description={
          <>
            Вы собираетесь удалить{" "}
            <span className="font-medium text-foreground">
              {fieldIdsToDelete.length}
            </span>{" "}
            {pluralizeRu(fieldIdsToDelete.length, ["поле", "поля", "полей"])}.
            Это действие нельзя будет отменить.
          </>
        }
        items={fieldsToDelete.map((row) => ({
          id: row.id,
          title: row.original.label || row.original.name,
          description: row.original.name,
        }))}
        isPending={isDeletingFields}
        onConfirm={confirmDeleteFields}
      />
    </EditView>
  );
}

function FormLabel({ children }: { children: ReactNode }) {
  return (
    <div className="pt-2 text-sm font-medium text-muted-foreground">
      {children}
    </div>
  );
}

function FieldInspector({
  field,
  tableNames,
  onChange,
  onClose,
}: {
  field: AdminFieldMeta;
  tableNames: string[];
  onChange: (payload: UpdateAdminFieldInput) => void;
  onClose: () => void;
}) {
  const fieldLabel = field.label || field.name;

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

      <div className="space-y-2">
        <FormLabel>Название поля *</FormLabel>
        <Input
          value={field.label}
          onChange={(event) => onChange({ label: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>Группа</FormLabel>
        <Input
          placeholder="Например: Основное"
          value={field.group ?? ""}
          onChange={(event) =>
            onChange({ group: emptyToNull(event.target.value) })
          }
        />
      </div>

      <div className="space-y-2">
        <FormLabel>Тип ввода *</FormLabel>

        <Select
          value={field.inputType}
          onValueChange={(value) => {
            const inputType = value as AdminFieldMeta["inputType"];

            onChange({
              inputType,
              relation:
                inputType === "select" || inputType === "multiselect"
                  ? field.relation ?? {
                      targetTable: tableNames[0] ?? "users",
                      targetKey: "id",
                      displayField: "name",
                      additionalText: null,
                    }
                  : null,
            });
          }}
        >
          <SelectTrigger className="w-full max-w-80">
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

      <div className="space-y-2">
        <FormLabel>Плейсхолдер</FormLabel>
        <Input
          value={field.placeholder ?? ""}
          onChange={(event) => onChange({ placeholder: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>Подсказка</FormLabel>
        <Textarea
          value={field.helpText ?? ""}
          onChange={(event) => onChange({ helpText: event.target.value })}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        {(
          [
            ["required", "Обязательное поле"],
            ["editable", "Редактируемое поле"],
            ["sortable", "Разрешить сортировку"],
            ["filterable", "Разрешить фильтрацию"],
            ["visible", "Показывать в форме"],
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

      <JsonEditorField
        label="Значение по умолчанию (JSON)"
        value={field.defaultValue ?? null}
        fallbackValue={null}
        onApply={(value) => onChange({ defaultValue: value })}
      />

      {(field.inputType === "select" || field.inputType === "multiselect") && (
        <>
          <Separator />

          <JsonEditorField<FieldOption[]>
            label="Опции (JSON)"
            value={field.options ?? []}
            fallbackValue={[]}
            description='Формат: [{"label":"Новый","value":"new"}]'
            onApply={(value) => onChange({ options: Array.isArray(value) ? value : [] })}
          />
        </>
      )}

      <Separator />

      <JsonEditorField<FieldValidationMeta>
        label="Validation (JSON)"
        value={field.validation ?? DEFAULT_FIELD_VALIDATION}
        fallbackValue={DEFAULT_FIELD_VALIDATION}
        description='По умолчанию ограничений нет: {"min":null,"max":null,"minLength":null,"maxLength":null,"pattern":null}'
        onApply={(value) =>
          onChange({
            validation:
              typeof value === "object" && value !== null
                ? ({
                    ...DEFAULT_FIELD_VALIDATION,
                    ...value,
                  } as FieldValidationMeta)
                : DEFAULT_FIELD_VALIDATION,
          })
        }
      />

      {(field.inputType === "select" || field.inputType === "multiselect") && (
        <>
          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Настройки связи</h3>

            <div className="space-y-2">
              <FormLabel>Целевая таблица *</FormLabel>
              <Select
                value={field.relation?.targetTable ?? (tableNames[0] ?? "users")}
                onValueChange={(value) =>
                  onChange({
                    relation: {
                      targetTable: value,
                      targetKey: field.relation?.targetKey ?? "id",
                      displayField: field.relation?.displayField ?? "name",
                      additionalText: field.relation?.additionalText ?? null,
                    },
                  })
                }
              >
                <SelectTrigger className="w-full max-w-80">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {tableNames.map((tableName) => (
                    <SelectItem value={tableName} key={tableName}>
                      {tableName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FormLabel>Ключ связи *</FormLabel>
              <Input
                placeholder="Например: id"
                value={field.relation?.targetKey ?? "id"}
                onChange={(event) =>
                  onChange({
                    relation: {
                      targetTable: field.relation?.targetTable ?? (tableNames[0] ?? "users"),
                      targetKey: event.target.value || "id",
                      displayField: field.relation?.displayField ?? "name",
                      additionalText: field.relation?.additionalText ?? null,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Поле отображения *</FormLabel>
              <Input
                placeholder="Например: name"
                value={field.relation?.displayField ?? "name"}
                onChange={(event) =>
                  onChange({
                    relation: {
                      targetTable: field.relation?.targetTable ?? (tableNames[0] ?? "users"),
                      targetKey: field.relation?.targetKey ?? "id",
                      displayField: event.target.value || "name",
                      additionalText: field.relation?.additionalText ?? null,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Дополнительный текст</FormLabel>
              <Input
                placeholder="Например: email"
                value={field.relation?.additionalText ?? ""}
                onChange={(event) =>
                  onChange({
                    relation: {
                      targetTable: field.relation?.targetTable ?? (tableNames[0] ?? "users"),
                      targetKey: field.relation?.targetKey ?? "id",
                      displayField: field.relation?.displayField ?? "name",
                      additionalText: emptyToNull(event.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function JsonEditorField<T>({
  label,
  value,
  fallbackValue,
  description,
  onApply,
}: {
  label: string;
  value: T;
  fallbackValue: T;
  description?: string;
  onApply: (value: T) => void;
}) {
  const [text, setText] = useState(() => toPrettyJson(value ?? fallbackValue));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(toPrettyJson(value ?? fallbackValue));
    setError(null);
  }, [value, fallbackValue]);

  const apply = () => {
    try {
      const parsed = JSON.parse(text) as T;
      onApply(parsed);
      setError(null);
    } catch {
      setError("Некорректный JSON");
    }
  };

  const reset = () => {
    const next = toPrettyJson(fallbackValue);
    setText(next);
    setError(null);
    onApply(fallbackValue);
  };

  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      <Textarea
        className="min-h-28 font-mono text-xs"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={apply}>
          Применить JSON
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          Сбросить
        </Button>
        {error ? <span className="text-xs text-destructive">{error}</span> : null}
      </div>
    </div>
  );
}

function toPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
