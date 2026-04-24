import { Controller } from "react-hook-form";
import { useParams } from "react-router";
import type {
  AdminFieldMeta,
  AdminTableActionKey,
  CreateAdminFieldInput,
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
import { DeleteItemsDialog } from "@/components/DeleteItemsDialog";
import { DeleteItemsToolbar } from "@/components/DeleteItemsToolbar";
import { LoadingBanner } from "@/components/LoadingBanner";
import { pluralizeRu } from "@/lib/ru-plural";
import { FieldInspector } from "@/components/FieldInspector";
import { useTableEditPage } from "@/hooks/use-table-edit-page";
import { useCreate } from "@refinedev/core";

export function TableEditPage() {
  const { id } = useParams<{ id: string }>();

  const vm = useTableEditPage(id);

  const { mutate: createField, mutation: mutationField } =
    useCreate<AdminFieldMeta>();

  const isCreatingField = mutationField.isPending;

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

  const handleCreateField = async () => {
    if (!id || isCreatingField) {
      return;
    }

    const fieldIndex = vm.fieldRows.length + 1;

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

    vm.setActiveFieldId(createdField.id);
  };

  const {
    register,
    control,
    handleSubmit,
    refineCore: { formLoading },
  } = vm.tableForm;

  return (
    <EditView>
      <EditViewHeader
        title="Редактирование таблицы"
        onSave={handleSubmit(vm.saveTable)}
        saving={formLoading}
      />

      {!vm.isSuccessLoaded && <LoadingBanner />}

      {vm.isSuccessLoaded && (
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

                    <FormLabel>ID таблицы в БД</FormLabel>
                    <Input value={vm.editTableData?.data.id ?? ""} readOnly />

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
                      selectedCount={vm.selectedFieldsCount}
                      deleteDisabled={
                        !vm.hasSelectedFields || vm.isDeletePending
                      }
                      onDeleteClick={() =>
                        vm.openDeleteFieldsDialog(vm.selectedFieldIds)
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
                    table={vm.fieldsTable as any}
                    onRowClick={(row) => vm.setActiveFieldId(row.id)}
                  />
                </CardContent>
              </Card>
            </section>

            <Card className="sticky top-24 h-fit">
              <CardContent>
                {vm.selectedField ? (
                  <FieldInspector
                    tablesData={vm.tablesData}
                    key={vm.selectedField.id}
                    field={vm.selectedField}
                    onChange={vm.patchSelectedField}
                    onClose={() => vm.setActiveFieldId(null)}
                    isUpdating={vm.isFieldUpdating}
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
            open={vm.isDeleteDialogOpen}
            onOpenChange={vm.setIsDeleteDialogOpen}
            title="Удалить выбранные поля?"
            description={
              <>
                Вы собираетесь удалить{" "}
                <span className="font-medium text-foreground">
                  {vm.fieldIdsToDelete.length}
                </span>{" "}
                {pluralizeRu(vm.fieldIdsToDelete.length, [
                  "поле",
                  "поля",
                  "полей",
                ])}
                . Это действие нельзя будет отменить.
              </>
            }
            items={vm.fieldsToDelete.map((row) => ({
              id: row.id,
              title: row.original.label || row.original.name,
              description: row.original.name,
            }))}
            isPending={vm.isDeletePending}
            onConfirm={vm.confirmDeleteFields}
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
