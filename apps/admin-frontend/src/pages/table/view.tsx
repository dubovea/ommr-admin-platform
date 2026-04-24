import { useEffect, useMemo, useState } from "react";
import { useDeleteMany, useNavigation } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Pencil, Search } from "lucide-react";
import {
  ADMIN_TABLE_SOURCE_LABELS,
  ADMIN_TABLE_SOURCES,
  ADMIN_TABLE_STATUS_LABELS,
  ADMIN_TABLE_STATUSES,
  type AdminTableMeta,
  type AdminTableSource,
  type AdminTableStatus,
} from "@ommr/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { DataTableSorter } from "@/components/refine-ui/data-table/data-table-sorter";
import {
  ListView,
  ListViewHeader,
} from "@/components/refine-ui/views/list-view";

import { StatusBadge } from "@/components/StatusBadge";
import { TableIcon } from "@/components/TableIcon";
import { useTableSelection } from "@/hooks/use-table-selection";
import {
  getSelectionCheckboxState,
  SELECTION_COLUMN_SIZE,
  TableSelectionCheckBox,
} from "@/components/TableSelectionCheckBox";
import { DeleteItemsToolbar } from "@/components/DeleteItemsToolbar";
import { pluralizeRu } from "@/lib/ru-plural";
import { DeleteItemsDialog } from "@/components/DeleteItemsDialog";
import {
  DataTableFilterCombobox,
  DataTableFilterDropdownText,
} from "@/components/refine-ui/data-table/data-table-filter";

const SOURCE_FILTER_OPTIONS = ADMIN_TABLE_SOURCES.map((source) => ({
  label: ADMIN_TABLE_SOURCE_LABELS[source],
  value: source,
}));

const STATUS_FILTER_OPTIONS = ADMIN_TABLE_STATUSES.map((status) => ({
  label: ADMIN_TABLE_STATUS_LABELS[status],
  value: status,
}));

function getSourceBadgeClassName(source: AdminTableSource) {
  switch (source) {
    case "pydantic":
      return "bg-violet-100 text-violet-700";
    case "manual":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusDotClassName(status: AdminTableStatus) {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-700";
    case "needs_setup":
      return "bg-amber-100 text-amber-700";
    case "partial":
      return "bg-blue-100 text-blue-700";
    case "ready":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function SourceBadge({ source }: { source: AdminTableSource }) {
  const label = ADMIN_TABLE_SOURCE_LABELS[source];

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span
        className={`grid size-5 place-items-center rounded text-xs font-bold ${getSourceBadgeClassName(
          source,
        )}`}
      >
        {source.charAt(0).toUpperCase()}
      </span>

      {label}
    </div>
  );
}

function StatusInlineBadge({ status }: { status: AdminTableStatus }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span
        className={`rounded px-2 py-0.5 text-xs font-medium ${getStatusDotClassName(
          status,
        )}`}
      >
        {ADMIN_TABLE_STATUS_LABELS[status]}
      </span>
    </div>
  );
}

export function TableListPage() {
  const { edit } = useNavigation();
  const [previewTableId, setPreviewTableId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    rowSelection,
    setRowSelection,
    selectedIds: selectedTableIds,
    selectedCount,
    hasSelectedRows,
    clearSelection,
  } = useTableSelection();

  const { mutate: deleteMany, mutation } = useDeleteMany<AdminTableMeta>();
  const isLoading = mutation.isPending;

  const columns = useMemo<ColumnDef<AdminTableMeta>[]>(
    () => [
      {
        id: "select",
        size: SELECTION_COLUMN_SIZE,
        minSize: SELECTION_COLUMN_SIZE,
        maxSize: SELECTION_COLUMN_SIZE,
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        header: ({ table }) => (
          <TableSelectionCheckBox
            checked={getSelectionCheckboxState(
              table.getIsAllPageRowsSelected(),
              table.getIsSomePageRowsSelected(),
            )}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(value === true);
            }}
            ariaLabel="Выбрать все строки"
          />
        ),
        cell: ({ row }) => (
          <div onClick={(event) => event.stopPropagation()}>
            <TableSelectionCheckBox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => {
                row.toggleSelected(value === true);
              }}
              ariaLabel="Выбрать строку"
            />
          </div>
        ),
      },
      {
        id: "name",
        accessorKey: "name",
        minSize: 400,
        meta: {
          filterOperator: "contains",
        },
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>Таблица</span>
            <DataTableSorter column={column} />
            <DataTableFilterDropdownText
              column={column}
              table={table}
              defaultOperator="contains"
              placeholder="Поиск по key"
            />
          </div>
        ),
        cell: ({ row }) => {
          const isPreviewActive = previewTableId === row.original.id;

          return (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={isPreviewActive ? "secondary" : "ghost"}
                size="icon"
                className="size-9 shrink-0 cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation();
                  setPreviewTableId(row.original.id);
                }}
                aria-label={`Показать таблицу ${
                  row.original.label || row.original.name
                }`}
              >
                <TableIcon icon={row.original.icon} />
              </Button>

              <div className="min-w-0">
                <strong className="block truncate">
                  {row.original.label || row.original.name}
                </strong>

                <span className="block truncate text-xs text-muted-foreground">
                  {row.original.name}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "source",
        accessorKey: "source",
        minSize: 180,
        meta: {
          filterOperator: "in",
        },
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Источник</span>
            <DataTableSorter column={column} />
            <DataTableFilterCombobox
              column={column}
              defaultOperator="in"
              multiple
              options={SOURCE_FILTER_OPTIONS}
            />
          </div>
        ),
        cell: ({ row }) => <SourceBadge source={row.original.source} />,
      },
      {
        id: "status",
        accessorKey: "status",
        minSize: 180,
        meta: {
          filterOperator: "in",
        },
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Статус</span>
            <DataTableSorter column={column} />
            <DataTableFilterCombobox
              column={column}
              defaultOperator="in"
              multiple
              options={STATUS_FILTER_OPTIONS}
            />
          </div>
        ),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        minSize: 150,
        meta: {
          filterOperator: "contains",
        },
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>Обновлено</span>
            <DataTableSorter column={column} />
            <DataTableFilterDropdownText
              column={column}
              table={table}
              defaultOperator="contains"
              placeholder="Поиск по дате"
            />
          </div>
        ),
        cell: ({ row }) => {
          const value = row.original.updatedAt
            ? new Date(row.original.updatedAt).toLocaleString()
            : "";

          return <span className="text-muted-foreground">{value}</span>;
        },
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        size: 60,
        minSize: 60,
        maxSize: 60,
        cell: ({ row }) => (
          <div
            className="flex justify-end"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              className="cursor-pointer"
              variant="outline"
              size="icon"
              onClick={() => edit("tables", row.original.id)}
            >
              <Edit className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [edit, previewTableId],
  );

  const table = useTable<AdminTableMeta>({
    columns,
    getRowId: (row) => row.id,
    enableMultiRowSelection: true,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    refineCoreProps: {
      resource: "tables",
      pagination: {
        mode: "client",
      },
    },
  });

  const reactTable = table.reactTable;
  const rows = reactTable.getRowModel().rows;

  const selectedTables = useMemo(
    () => rows.filter((row) => selectedTableIds.includes(row.id)),
    [rows, selectedTableIds],
  );

  const selectedTable =
    rows.find((row) => row.id === previewTableId)?.original ??
    rows[0]?.original ??
    null;

  useEffect(() => {
    if (rows.length === 0) {
      setPreviewTableId(null);
      return;
    }

    if (previewTableId && rows.some((row) => row.id === previewTableId)) {
      return;
    }

    setPreviewTableId(rows[0].id);
  }, [rows, previewTableId]);

  function handleDeleteSelected() {
    if (!hasSelectedRows) return;

    deleteMany(
      {
        resource: "tables",
        ids: selectedTableIds,
      },
      {
        onSuccess: () => {
          clearSelection();
          setIsDeleteDialogOpen(false);

          if (previewTableId && selectedTableIds.includes(previewTableId)) {
            const nextPreviewRow = rows.find(
              (row) => !selectedTableIds.includes(row.id),
            );

            setPreviewTableId(nextPreviewRow?.id ?? null);
          }
        },
      },
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-6">
      <ListView>
        <ListViewHeader title="Таблицы" />

        <Card className="border-blue-200 bg-blue-50/40 shadow-none">
          <CardContent className="flex gap-4 p-5">
            <div className="grid size-7 place-items-center rounded-full border-2 border-blue-600 text-sm font-bold text-blue-600">
              i
            </div>

            <div>
              <div className="font-semibold">
                Импортированы базовые свойства из Pydantic
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Импортированы только базовые свойства: имена, поля, типы и связи из x-relation.
                Остальные настройки задаются в интерфейсе и влияют на отображение таблиц в OMMR приложении.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Поиск по названию таблицы..."
            />
          </div>

          <DeleteItemsToolbar
            selectedCount={selectedCount}
            deleteDisabled={!hasSelectedRows || isLoading}
            onDeleteClick={() => setIsDeleteDialogOpen(true)}
          />
        </div>

        <DataTable table={table as any} />
      </ListView>

      <Card className="sticky top-24 h-fit">
        <CardHeader>
          <CardTitle>Предпросмотр таблицы</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {selectedTable ? (
            <>
              <div className="flex items-center gap-4">
                <TableIcon icon={selectedTable.icon} />

                <div>
                  <h2 className="text-2xl font-semibold">
                    {selectedTable.label || selectedTable.name}
                  </h2>

                  <div className="mt-1 text-sm text-muted-foreground">
                    {selectedTable.name}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <SourceBadge source={selectedTable.source} />
                    <StatusInlineBadge status={selectedTable.status} />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 text-sm">
                <MetaRow label="Название" value={selectedTable.label} />
                <MetaRow label="Имя в БД" value={selectedTable.name} />
                <MetaRow
                  label="Описание"
                  value={selectedTable.description || "—"}
                />
                <MetaRow
                  label="Поля"
                  value={String(selectedTable.fieldsCount ?? 0)}
                />
                <MetaRow
                  label="Обязательные поля"
                  value={String(selectedTable.requiredFieldsCount ?? 0)}
                />
                <MetaRow
                  label="Связи"
                  value={String(selectedTable.relationsCount ?? 0)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="font-semibold">Что осталось настроить</div>

                {[
                  ["Названия полей", true],
                  ["Типы полей", true],
                  ["Отображение в таблице", false],
                  ["Фильтры и сортировка", false],
                ].map(([label, done]) => (
                  <div
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                    key={label as string}
                  >
                    <span
                      className={
                        done
                          ? "size-5 rounded-full bg-blue-600 shadow-[inset_0_0_0_5px_white]"
                          : "size-5 rounded-full border"
                      }
                    />
                    {label}
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => edit("tables", selectedTable.id)}
              >
                <Pencil className="size-4" />
                Редактировать таблицу
              </Button>
            </>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Нет выбранной таблицы
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteItemsDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Удалить выбранные таблицы?"
        description={
          <>
            Вы собираетесь удалить{" "}
            <span className="font-medium text-foreground">
              {selectedCount}
            </span>{" "}
            {pluralizeRu(selectedCount, ["таблицу", "таблицы", "таблиц"])}. Это
            действие нельзя будет отменить.
          </>
        }
        items={selectedTables.map((row) => ({
          id: row.id,
          title: row.original.label || row.original.name,
          description: row.original.name,
        }))}
        isPending={isLoading}
        onConfirm={handleDeleteSelected}
      />
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <strong className="text-right font-medium">{value}</strong>
    </div>
  );
}