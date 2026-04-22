import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
export function DataTableSorter<TData, TValue>({
  column,
}: {
  column: Column<TData, TValue>;
}) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ChevronsUpDown className="size-3.5" />
      )}
    </Button>
  );
}
