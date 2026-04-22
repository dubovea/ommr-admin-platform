import type { Table as TanStackTable } from "@tanstack/react-table";

type MaybeRefineTable<TData> =
  | TanStackTable<TData>
  | { reactTable: TanStackTable<TData> };

export function getTanStackTable<TData>(
  table: MaybeRefineTable<TData>,
): TanStackTable<TData> {
  if ("getRowModel" in table && typeof table.getRowModel === "function")
    return table;
  if ("reactTable" in table) return table.reactTable;
  throw new Error(
    "Invalid table instance. Expected TanStack Table or Refine reactTable adapter.",
  );
}
