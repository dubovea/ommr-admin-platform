import { useEffect, useMemo, useState } from "react";
import {
  type HttpError,
  useDelete,
  useInvalidate,
  useUpdate,
} from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { useTable } from "@refinedev/react-table";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { Link2, Pencil, Trash2, Upload, X } from "lucide-react";
import { useParams } from "react-router";
import {
  FIELD_INPUT_TYPE_LABELS,
  FIELD_INPUT_TYPES,
  type AdminFieldFlagKey,
  type AdminFieldMeta,
  type AdminTableActionKey,
  type AdminTableMeta,
  type RelationType,
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

export function TableEditPage() {
  const { id } = useParams<{ id: string }>();
  const invalidate = useInvalidate();
  const [fieldRowSelection, setFieldRowSelection] = useState<RowSelectionState>(
    {},
  );
  const {
    register,
    control,
    handleSubmit,
    refineCore: { onFinish, queryResult, formLoading },
  } = useForm<AdminTableMeta, HttpError, UpdateAdminTableInput>({
    refineCoreProps: {
      resource: "tables",
      id,
      action: "edit",
      redirect: false,
      queryOptions: { enabled: Boolean(id) },
      onMutationSuccess: () => toast.success("Таблица сохранена"),
    },
  });
  const tableRecord = queryResult?.data?.data;
  const { mutate: updateField } = useUpdate<AdminFieldMeta>();
  const { mutate: deleteField } = useDelete();
  const fieldColumns = useMemo<ColumnDef<AdminFieldMeta>[]>(
    () => [
      {
        id: "select",
        header: "",
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
            aria-label="Выбрать поле"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "name",
        accessorKey: "name",
        header: "Поле",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">⋮⋮</span>
            {row.original.relation ? (
              <Link2 className="size-4 text-violet-600" />
            ) : null}
            <strong>{row.original.name}</strong>
          </div>
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
        id: "showInList",
        accessorKey: "showInList",
        header: "Показывать в таблице",
        cell: ({ row }) => (
          <Checkbox checked={row.original.showInList} disabled />
        ),
      },
      {
        id: "showInForm",
        accessorKey: "showInForm",
        header: "Показывать в форме",
        cell: ({ row }) => (
          <Checkbox checked={row.original.showInForm} disabled />
        ),
      },
      {
        id: "actions",
        header: "Действия",
        cell: ({ row }) => (
          <div
            className="flex items-center gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => setFieldRowSelection({ [row.id]: true })}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                deleteField(
                  { resource: "fields", id: row.original.id },
                  {
                    onSuccess: () => {
                      toast.success("Поле удалено");
                      invalidate({ resource: "fields", invalidates: ["list"] });
                    },
                  },
                )
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteField, invalidate],
  );
  const fieldsTable = useTable<AdminFieldMeta>({
    columns: fieldColumns,
    getRowId: (row) => row.id,
    enableMultiRowSelection: false,
    state: { rowSelection: fieldRowSelection },
    onRowSelectionChange: setFieldRowSelection,
    refineCoreProps: {
      resource: "fields",
      filters: { permanent: [{ field: "tableId", operator: "eq", value: id }] },
      queryOptions: { enabled: Boolean(id) },
      pagination: { mode: "off" },
    },
  });
  const reactFieldsTable = fieldsTable.reactTable;
  const fieldRows = reactFieldsTable.getRowModel().rows;
  useEffect(() => {
    if (fieldRows.length === 0 || Object.keys(fieldRowSelection).length > 0)
      return;
    const userIdRow = fieldRows.find((row) => row.original.name === "user_id");
    const rowToSelect = userIdRow ?? fieldRows[0];
    setFieldRowSelection({ [rowToSelect.id]: true });
  }, [fieldRows.length, fieldRowSelection]);
  const selectedField =
    reactFieldsTable.getSelectedRowModel().rows[0]?.original ??
    fieldRows[0]?.original ??
    null;
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
          invalidate({ resource: "fields", invalidates: ["list"] }),
      },
    );
  }
  if (formLoading || !tableRecord)
    return (
      <div className="p-10 text-center text-muted-foreground">
        Загружаем таблицу...
      </div>
    );
  return (
    <EditView>
      <EditViewHeader
        title={`Редактирование таблицы / ${tableRecord.name}`}
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
      <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-5">
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
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Поля таблицы</CardTitle>
              <div className="flex gap-2">
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
                selectedRowId={selectedField?.id}
                getRowId={(row) => row.id}
                onRowClick={(row) => setFieldRowSelection({ [row.id]: true })}
              />
            </CardContent>
          </Card>
        </section>
        <Card className="sticky top-24 h-fit">
          <CardContent className="p-5">
            {selectedField ? (
              <FieldInspector
                field={selectedField}
                onChange={patchSelectedField}
              />
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                Выберите поле
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EditView>
  );
}
function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2 text-sm font-medium text-muted-foreground">
      {children}
    </div>
  );
}
function FieldInspector({
  field,
  onChange,
}: {
  field: AdminFieldMeta;
  onChange: (payload: UpdateAdminFieldInput) => void;
}) {
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
              <div className="font-semibold">{field.name}</div>
              <div className="text-xs text-muted-foreground">
                {field.relation ? "Поле связи" : field.dbType}
              </div>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <X className="size-4" />
        </Button>
      </div>
      <Separator />
      <div className="space-y-2">
        <FormLabel>Label *</FormLabel>
        <Input
          value={field.label}
          onChange={(event) => onChange({ label: event.target.value })}
        />
      </div>
      <div className="space-y-2">
        <FormLabel>Тип поля *</FormLabel>
        <Select
          value={field.inputType}
          onValueChange={(value) => {
            const inputType = value as AdminFieldMeta["inputType"];
            onChange({
              inputType,
              relation:
                inputType === "select" || inputType === "multiselect"
                  ? (field.relation ?? {
                      targetTable: "users",
                      relationType: "many-to-one",
                      displayField: "full_name",
                    })
                  : null,
            });
          }}
        >
          <SelectTrigger>
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
        <FormLabel>Placeholder</FormLabel>
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
            ["showInList", "Показывать в таблице"],
            ["showInForm", "Показывать в форме"],
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
      {(field.inputType === "select" || field.inputType === "multiselect") && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Настройки связи</h3>
            <RelationSelect
              label="Целевая таблица *"
              value={field.relation?.targetTable ?? "users"}
              options={["users", "products", "categories"]}
              onValueChange={(value) =>
                onChange({
                  relation: {
                    targetTable: value,
                    relationType: field.relation?.relationType ?? "many-to-one",
                    displayField: field.relation?.displayField ?? "full_name",
                  },
                })
              }
            />
            <div className="space-y-2">
              <FormLabel>Тип связи</FormLabel>
              <Select
                value={field.relation?.relationType ?? "many-to-one"}
                onValueChange={(value) =>
                  onChange({
                    relation: {
                      targetTable: field.relation?.targetTable ?? "users",
                      relationType: value as RelationType,
                      displayField: field.relation?.displayField ?? "full_name",
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="many-to-one">
                    Многие к одному (N:1)
                  </SelectItem>
                  <SelectItem value="one-to-one">
                    Один к одному (1:1)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <RelationSelect
              label="Отображаемое поле *"
              value={field.relation?.displayField ?? "full_name"}
              options={["full_name", "name", "title"]}
              onValueChange={(value) =>
                onChange({
                  relation: {
                    targetTable: field.relation?.targetTable ?? "users",
                    relationType: field.relation?.relationType ?? "many-to-one",
                    displayField: value,
                  },
                })
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
function RelationSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem value={option} key={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
