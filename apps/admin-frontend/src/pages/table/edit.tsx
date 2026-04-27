import { Controller } from "react-hook-form";
import { useParams } from "react-router";
import { useCreate } from "@refinedev/core";
import {
  ADMIN_TABLE_GROUP_OPTIONS,
  type AdminFieldMeta,
  type AdminTableActionKey,
  type CreateAdminFieldInput,
  type UpdateAdminTableInput,
} from "@ommr/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import {
  EditView,
  EditViewHeader,
} from "@/components/refine-ui/views/edit-view";
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
import { Separator } from "@/components/ui/separator";

import { DeleteItemsDialog } from "@/components/DeleteItemsDialog";
import { DeleteItemsToolbar } from "@/components/DeleteItemsToolbar";
import { LoadingBanner } from "@/components/LoadingBanner";
import { pluralizeRu } from "@/lib/ru-plural";
import { FieldInspector } from "@/components/FieldInspector";
import { useTableEditPage } from "@/hooks/use-table-edit-page";
import { EMPTY_GROUP_VALUE } from "@/lib/table-groups";

export function TableEditPage() {
  const { id } = useParams<{ id: string }>();

  const tableEdit = useTableEditPage(id);

  const { mutate: createField, mutation: mutationField } =
    useCreate<AdminFieldMeta>();

  const isCreatingField = mutationField.isPending;

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

  const handleCreateField = async () => {
    if (!id || isCreatingField) {
      return;
    }

    const fieldIndex = tableEdit.fieldRows.length + 1;

    const createdField = await createFieldAsync({
      tableId: id,
      name: `new_field_${fieldIndex}`,
      label: `Новое поле ${fieldIndex}`,
      dbType: "",
      inputType: "text",
      required: false,
      editable: false,
      sortable: false,
      filterable: false,
      visible: false,
      group: null,
      defaultValue: null,
      options: null,
      validation: null,
      placeholder: null,
      helpText: null,
      relation: null,
      sortOrder: fieldIndex,
    });

    tableEdit.setActiveFieldId(createdField.id);
  };

  const patchTableSafely = (payload: UpdateAdminTableInput) => {
    void tableEdit.patchTable(payload).catch(() => undefined);
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    refineCore: { formLoading },
  } = tableEdit.tableForm;

  return (
    <EditView>
      <EditViewHeader
        title="Редактирование таблицы"
        onSave={handleSubmit(tableEdit.saveTable)}
        saving={formLoading}
      />

      {!tableEdit.isSuccessLoaded && <LoadingBanner />}

      {tableEdit.isSuccessLoaded && (
        <>
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
                    <Input {...register("name")} />

                    <FormLabel>Группировка таблицы</FormLabel>
                    <Controller
                      name="group"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? EMPTY_GROUP_VALUE}
                          disabled={tableEdit.isTableUpdating}
                          onValueChange={(value) => {
                            if (value === EMPTY_GROUP_VALUE) {
                              field.onChange(null);

                              setValue("groupName", null, {
                                shouldDirty: true,
                                shouldTouch: true,
                              });

                              patchTableSafely({
                                group: null,
                                groupName: null,
                              });

                              return;
                            }

                            const selectedGroup = ADMIN_TABLE_GROUP_OPTIONS.find(
                              (group) => group.id === value,
                            );

                            const groupName = selectedGroup?.label ?? value;

                            field.onChange(value);

                            setValue("groupName", groupName, {
                              shouldDirty: true,
                              shouldTouch: true,
                            });

                            patchTableSafely({
                              group: value,
                              groupName,
                            });
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Выберите группу" />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value={EMPTY_GROUP_VALUE}>
                              Без группы
                            </SelectItem>

                            {ADMIN_TABLE_GROUP_OPTIONS.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />

                    <FormLabel>Название группы</FormLabel>
                    <Controller
                      name="groupName"
                      control={control}
                      render={({ field }) => (
                        <Input
                          value={field.value ?? ""}
                          placeholder="Например: Мастер-таблицы"
                          disabled={tableEdit.isTableUpdating}
                          onChange={field.onChange}
                          onBlur={(event) => {
                            field.onBlur();

                            patchTableSafely({
                              groupName: event.target.value || null,
                            });
                          }}
                        />
                      )}
                    />

                    <FormLabel>ID таблицы в БД</FormLabel>
                    <Input
                      value={tableEdit.editTableData?.data.id ?? ""}
                      readOnly
                    />

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
                              disabled={tableEdit.isTableUpdating}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);

                                patchTableSafely({
                                  [key]: checked,
                                } as UpdateAdminTableInput);
                              }}
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
                              Если выключено, таблица останется в metadata, но
                              не попадёт в sidebar.
                            </div>
                          </div>

                          <Switch
                            checked={Boolean(field.value)}
                            disabled={tableEdit.isTableUpdating}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);

                              patchTableSafely({
                                showInMenu: checked,
                              });
                            }}
                          />
                        </div>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                  <CardTitle>Поля таблицы</CardTitle>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <DeleteItemsToolbar
                      selectedCount={tableEdit.selectedFieldsCount}
                      deleteDisabled={
                        !tableEdit.hasSelectedFields ||
                        tableEdit.isDeletePending
                      }
                      onDeleteClick={() =>
                        tableEdit.openDeleteFieldsDialog(
                          tableEdit.selectedFieldIds,
                        )
                      }
                    />

                    <Button
                      variant="outline"
                      disabled={isCreatingField}
                      onClick={handleCreateField}
                    >
                      + Добавить поле
                    </Button>

                    <Button variant="outline">Импортировать поля</Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <DataTable
                    table={tableEdit.fieldsTable as any}
                    onRowClick={(row) =>
                      tableEdit.setActiveFieldId(row.id ? String(row.id) : null)
                    }
                  />
                </CardContent>
              </Card>
            </section>

            <Card className="sticky top-24 h-fit">
              <CardContent>
                {tableEdit.selectedField ? (
                  <FieldInspector
                    tablesData={tableEdit.tablesData}
                    key={tableEdit.selectedField.id}
                    field={tableEdit.selectedField}
                    onChange={tableEdit.patchSelectedField}
                    onClose={() => tableEdit.setActiveFieldId(null)}
                    isUpdating={tableEdit.isFieldUpdating}
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
            open={tableEdit.isDeleteDialogOpen}
            onOpenChange={tableEdit.setIsDeleteDialogOpen}
            title="Удалить выбранные поля?"
            description={
              <>
                Вы собираетесь удалить{" "}
                <span className="font-medium text-foreground">
                  {tableEdit.fieldIdsToDelete.length}
                </span>{" "}
                {pluralizeRu(tableEdit.fieldIdsToDelete.length, [
                  "поле",
                  "поля",
                  "полей",
                ])}
                . Это действие нельзя будет отменить.
              </>
            }
            items={tableEdit.fieldsToDelete.map((row) => ({
              id: row.id,
              title: row.original.label || row.original.name,
              description: row.original.name,
            }))}
            isPending={tableEdit.isDeletePending}
            onConfirm={tableEdit.confirmDeleteFields}
          />
        </>
      )}
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
