import { useParams } from "react-router";
import { useCreate } from "@refinedev/core";
import {
  type AdminFieldMeta,
  type CreateAdminFieldInput,
} from "@ommr/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import {
  EditView,
  EditViewHeader,
} from "@/components/refine-ui/views/edit-view";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteItemsDialog } from "@/components/DeleteItemsDialog";
import { DeleteItemsToolbar } from "@/components/DeleteItemsToolbar";
import { LoadingBanner } from "@/components/LoadingBanner";
import { pluralizeRu } from "@/lib/ru-plural";
import { FieldInspector } from "@/components/FieldInspector";
import { useTableEditPage } from "@/hooks/use-table-edit-page";
import { TableInfoForm } from "@/components/form/TableInfoForm";

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

  return (
    <EditView>
      <EditViewHeader
        title="Редактирование таблицы"
        actionsSlot={
          <span className="text-sm text-muted-foreground">
            {tableEdit.isTableAutoSaving
              ? "Сохраняем..."
              : tableEdit.tableAutoSave.status === "error"
                ? "Ошибка автосохранения"
                : tableEdit.tableAutoSave.status === "success"
                  ? "Сохранено"
                  : "Автосохранение включено"}
          </span>
        }
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
              <TableInfoForm
                mode="edit"
                control={tableEdit.tableForm.control}
                register={tableEdit.tableForm.register}
                setValue={tableEdit.tableForm.setValue}
                editTableData={tableEdit.editTableData}
              />

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
