import type { Row, Table as TanStackTable } from "@tanstack/react-table";
import type { CheckedState } from "@/components/TableSelectionCheckBox";
import { getSelectionCheckboxState } from "@/components/TableSelectionCheckBox";

export function getSelectableLeafRows<TData>(
  table: TanStackTable<TData>,
): Row<TData>[] {
  const rowsById = new Map<string, Row<TData>>();

  table.getRowModel().rows.forEach((row) => {
    const leafRows = row.getIsGrouped() ? row.getLeafRows() : [row];

    leafRows.forEach((leafRow) => {
      if (!leafRow.getIsGrouped() && leafRow.getCanSelect()) {
        rowsById.set(leafRow.id, leafRow);
      }
    });
  });

  return [...rowsById.values()];
}

export function getLeafRowsSelectionState<TData>(
  table: TanStackTable<TData>,
): CheckedState {
  const leafRows = getSelectableLeafRows(table);

  if (leafRows.length === 0) {
    return false;
  }

  const selectedCount = leafRows.filter((row) => row.getIsSelected()).length;

  return getSelectionCheckboxState(
    selectedCount === leafRows.length,
    selectedCount > 0 && selectedCount < leafRows.length,
  );
}

export function toggleLeafRowsSelected<TData>(
  table: TanStackTable<TData>,
  checked: boolean,
) {
  getSelectableLeafRows(table).forEach((row) => {
    row.toggleSelected(checked);
  });
}
