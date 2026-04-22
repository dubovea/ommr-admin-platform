import { flexRender, type Table as TanStackTable } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getTanStackTable } from "@/lib/refine-table";

type DataTableProps<TData> = {
  table: TanStackTable<TData> | { reactTable: TanStackTable<TData> };
  onRowClick?: (row: TData) => void;
  selectedRowId?: string | null;
  getRowId?: (row: TData) => string;
};
export function DataTable<TData>({
  table,
  onRowClick,
  selectedRowId,
  getRowId,
}: DataTableProps<TData>) {
  const reactTable = getTanStackTable(table);
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          {reactTable.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="bg-muted/40 hover:bg-muted/40"
            >
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="h-11 px-4">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {reactTable.getRowModel().rows?.length ? (
            reactTable.getRowModel().rows.map((row) => {
              const rowId = getRowId?.(row.original) ?? row.id;
              const isSelected = Boolean(
                selectedRowId && rowId === selectedRowId,
              );
              return (
                <TableRow
                  key={row.id}
                  data-state={isSelected ? "selected" : undefined}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    isSelected &&
                      "bg-blue-50 hover:bg-blue-50 shadow-[inset_3px_0_0_#2563eb]",
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={reactTable.getAllColumns().length}
                className="h-24 text-center"
              >
                Нет данных
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
