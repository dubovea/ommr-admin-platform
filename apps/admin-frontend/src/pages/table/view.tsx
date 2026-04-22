import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigation } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Search } from "lucide-react";
import type { AdminTableMeta } from "@ommr/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function TableListPage() {
  const { edit } = useNavigation();

  /**
   * Только состояние чекбоксов.
   * Не используем его для правого preview.
   */
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  /**
   * Отдельное состояние выбранной таблицы для правой карточки.
   * Меняется только по клику на иконку таблицы.
   */
  const [previewTableId, setPreviewTableId] = useState<string | null>(null);

  const defaultSelectionAppliedRef = useRef(false);

  const columns = useMemo<ColumnDef<AdminTableMeta>[]>(
    () => [
      {
        id: "select",
        size: 40,
        minSize: 40,
        maxSize: 40,
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <div className="mx-2.75 flex w-10 items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => {
                table.toggleAllPageRowsSelected(!!value);
              }}
              aria-label="Выбрать все строки"
              className="size-4 cursor-pointer"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div
            className="flex w-10 items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => {
                row.toggleSelected(!!value);
              }}
              aria-label="Выбрать строку"
              className="size-4 cursor-pointer"
            />
          </div>
        ),
      },
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Таблица</span>
            <DataTableSorter column={column} />
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
                className="size-9 shrink-0"
                onClick={(event) => {
                  event.stopPropagation();
                  setPreviewTableId(row.original.id);
                }}
                aria-label={`Показать таблицу ${row.original.name}`}
              >
                <TableIcon icon={row.original.icon} />
              </Button>

              <strong>{row.original.name}</strong>
            </div>
          );
        },
      },
      {
        id: "label",
        accessorKey: "label",
        header: "Название",
      },
      {
        id: "source",
        accessorKey: "source",
        header: "Источник",
        cell: () => (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="grid size-5 place-items-center rounded bg-emerald-100 text-xs font-bold text-emerald-700">
              P
            </span>
            Pydantic
          </div>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Статус",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "fieldsCount",
        accessorKey: "fieldsCount",
        header: "Поля",
      },
      {
        id: "relationsCount",
        accessorKey: "relationsCount",
        header: "Связи",
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        header: "Обновлено",
        cell: () => <span className="text-muted-foreground">Сегодня</span>,
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
              onClick={() => edit("tables", row.original.id)}
            >
              <Eye className="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => edit("tables", row.original.id)}
                >
                  Редактировать
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

  useEffect(() => {
    if (rows.length === 0) return;
    const defaultRow = rows?.[0];

    if (!previewTableId) {
      setPreviewTableId(defaultRow.id);
    }

    if (!defaultSelectionAppliedRef.current) {
      defaultSelectionAppliedRef.current = true;

      setRowSelection((current) => {
        if (Object.keys(current).length > 0) {
          return current;
        }

        return {
          [defaultRow.id]: true,
        };
      });
    }
  }, [rows.length, previewTableId]);

  const selectedTable =
    rows.find((row) => row.id === previewTableId)?.original ??
    rows[0]?.original ??
    null;

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
                Мы импортировали только базовые свойства: имена, поля и типы.
                Остальные настройки задаются в интерфейсе.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Поиск по названию таблицы..." />
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
                    {selectedTable.name}
                  </h2>

                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="grid size-5 place-items-center rounded bg-emerald-100 text-xs font-bold text-emerald-700">
                      P
                    </span>
                    Pydantic
                  </div>
                </div>
              </div>

              <div className="grid gap-3 text-sm">
                <MetaRow label="Название" value={selectedTable.label} />
                <MetaRow label="Имя в БД" value={selectedTable.dbName} />
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
