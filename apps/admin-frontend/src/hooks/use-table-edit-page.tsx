import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type HttpError,
  useDeleteMany,
  useInvalidate,
  useList,
  useShow,
  useUpdate,
} from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { useTable } from "@refinedev/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Link2, Pencil, Trash2 } from "lucide-react";
import type {
  AdminFieldMeta,
  AdminTableMeta,
  UpdateAdminFieldInput,
  UpdateAdminTableInput,
} from "@ommr/shared";
import { FIELD_INPUT_TYPE_LABELS } from "@ommr/shared";
import { updateTableSchema } from "@ommr/shared/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getSelectionCheckboxState,
  SELECTION_COLUMN_SIZE,
  TableSelectionCheckBox,
} from "@/components/TableSelectionCheckBox";
import { useTableSelection } from "@/hooks/use-table-selection";

function normalizeTablePayload(
  values: UpdateAdminTableInput,
): UpdateAdminTableInput {
  return {
    label: values.label,
    name: values.name,
    description: values.description ?? null,

    group: values.group ?? null,
    groupName: values.groupName ?? null,
    showInMenu: values.showInMenu ?? true,

    canList: values.canList ?? true,
    canCreate: values.canCreate ?? true,
    canEdit: values.canEdit ?? true,
    canDelete: values.canDelete ?? false,
    status: values.status,
  };
}

export function useTableEditPage(tableId?: string) {
  const invalidate = useInvalidate();

  const {
    query: { data: editTableData, isLoading, isError },
  } = useShow<AdminTableMeta>({
    resource: "tables",
    id: tableId,
    queryOptions: {
      enabled: Boolean(tableId),
    },
  });

  const { query: tablesListData } = useList<AdminTableMeta>({
    resource: "tables",
    pagination: {
      mode: "off",
    },
    meta: {
      includeFields: true,
    },
  });

  const tableForm = useForm<AdminTableMeta, HttpError, UpdateAdminTableInput>({
    resolver: zodResolver(updateTableSchema),
    mode: "onChange",
    refineCoreProps: {
      resource: "tables",
      id: tableId,
      action: "edit",
      redirect: false,
      mutationMode: "optimistic",
      queryOptions: {
        enabled: Boolean(tableId),
      },
      autoSave: {
        enabled: true,
        debounce: 800,
        invalidateOnUnmount: true,
        onFinish: normalizeTablePayload,
      },
    },
  });

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

  const { mutate: updateField, mutation: updateFieldMutation } =
    useUpdate<AdminFieldMeta>();

  const { mutate: deleteFields, mutation: deleteFieldsMutation } =
    useDeleteMany<AdminFieldMeta>();

  const isFieldUpdating = updateFieldMutation.isPending;
  const isDeletePending = deleteFieldsMutation?.isPending;

  const isTableAutoSaving =
    tableForm.refineCore.autoSaveProps?.status === "pending";

  const invalidateFieldsAndTables = useCallback(() => {
    void invalidate({
      resource: "fields",
      invalidates: ["list"],
    });

    void invalidate({
      resource: "tables",
      invalidates: ["list", "detail"],
    });
  }, [invalidate]);

  const patchField = useCallback(
    (fieldId: string, payload: UpdateAdminFieldInput) => {
      return new Promise<void>((resolve, reject) => {
        updateField(
          {
            resource: "fields",
            id: fieldId,
            values: payload,
            mutationMode: "optimistic",
          },
          {
            onSuccess: () => {
              invalidateFieldsAndTables();
              resolve();
            },
            onError: reject,
          },
        );
      });
    },
    [invalidateFieldsAndTables, updateField],
  );

  const openDeleteFieldsDialog = useCallback((ids: string[]) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))];

    if (uniqueIds.length === 0) {
      return;
    }

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
        id: "inputType",
        accessorKey: "inputType",
        header: "Тип поля",
        minSize: 255,
        cell: ({ row }) => FIELD_INPUT_TYPE_LABELS[row.original.inputType],
      },
      {
        id: "visible",
        accessorKey: "visible",
        header: "Видимое",
        cell: ({ row }) => (
          <div
            className="flex justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <Checkbox
              checked={Boolean(row.original.visible)}
              disabled={isFieldUpdating}
              onCheckedChange={(checked) => {
                void patchField(row.original.id, {
                  visible: checked === true,
                }).catch(() => undefined);
              }}
            />
          </div>
        ),
      },
      {
        id: "required",
        accessorKey: "required",
        header: "Обязательное",
        cell: ({ row }) => (
          <div
            className="flex justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <Checkbox
              checked={Boolean(row.original.required)}
              disabled={isFieldUpdating}
              onCheckedChange={(checked) => {
                void patchField(row.original.id, {
                  required: checked === true,
                }).catch(() => undefined);
              }}
            />
          </div>
        ),
      },
      {
        id: "editable",
        accessorKey: "editable",
        header: "Редактируемое",
        cell: ({ row }) => (
          <div
            className="flex justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <Checkbox
              checked={Boolean(row.original.editable)}
              disabled={isFieldUpdating}
              onCheckedChange={(checked) => {
                void patchField(row.original.id, {
                  editable: checked === true,
                }).catch(() => undefined);
              }}
            />
          </div>
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
    [activeFieldId, isFieldUpdating, openDeleteFieldsDialog, patchField],
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
        permanent: tableId
          ? [{ field: "tableId", operator: "eq", value: tableId }]
          : [],
      },
      queryOptions: {
        enabled: Boolean(tableId),
      },
      pagination: {
        mode: "off",
      },
    },
  });

  const fieldRows = fieldsTable.reactTable.getRowModel().rows;

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
    setActiveFieldId((userIdRow ?? fieldRows[0]).id);
  }, [fieldRows, activeFieldId]);

  function patchSelectedField(payload: UpdateAdminFieldInput) {
    if (!selectedField) {
      return Promise.resolve();
    }

    return patchField(selectedField.id, payload);
  }

  const confirmDeleteFields = useCallback(() => {
    if (fieldIdsToDelete.length === 0) {
      return;
    }

    deleteFields(
      {
        resource: "fields",
        ids: fieldIdsToDelete,
      },
      {
        onSuccess: () => {
          removeSelectedFieldIds(fieldIdsToDelete);

          if (activeFieldId && fieldIdsToDelete.includes(activeFieldId)) {
            const nextActiveField = fieldRows.find(
              (row) => !fieldIdsToDelete.includes(row.id),
            );

            setActiveFieldId(nextActiveField?.id ?? null);
          }

          setFieldIdsToDelete([]);
          setIsDeleteDialogOpen(false);
          invalidateFieldsAndTables();
        },
      },
    );
  }, [
    activeFieldId,
    deleteFields,
    fieldIdsToDelete,
    fieldRows,
    invalidateFieldsAndTables,
    removeSelectedFieldIds,
  ]);

  return {
    editTableData,
    isLoading,
    isError,
    isSuccessLoaded: !isLoading && !isError && !!editTableData?.data,

    tablesData: tablesListData?.data?.data ?? [],

    tableForm,
    isTableAutoSaving,

    fieldsTable,
    fieldRows,
    selectedField,

    activeFieldId,
    setActiveFieldId,

    selectedFieldIds,
    selectedFieldsCount,
    hasSelectedFields,

    isDeletePending,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    fieldIdsToDelete,
    fieldsToDelete,
    openDeleteFieldsDialog,
    confirmDeleteFields,

    patchField,
    patchSelectedField,
    isFieldUpdating,
  };
}
