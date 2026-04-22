import { useCallback, useMemo, useState } from "react";
import type { RowSelectionState } from "@tanstack/react-table";

export function getSelectedRowIds(rowSelection: RowSelectionState) {
  return Object.keys(rowSelection).filter((id) => rowSelection[id]);
}

export function removeRowIdsFromSelection(
  rowSelection: RowSelectionState,
  ids: string[],
): RowSelectionState {
  const next = { ...rowSelection };

  ids.forEach((id) => {
    delete next[id];
  });

  return next;
}

export function useTableSelection() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectedIds = useMemo(
    () => getSelectedRowIds(rowSelection),
    [rowSelection],
  );

  const selectedCount = selectedIds.length;
  const hasSelectedRows = selectedCount > 0;

  const clearSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  const removeSelectedIds = useCallback((ids: string[]) => {
    setRowSelection((current) => removeRowIdsFromSelection(current, ids));
  }, []);

  return {
    rowSelection,
    setRowSelection,
    selectedIds,
    selectedCount,
    hasSelectedRows,
    clearSelection,
    removeSelectedIds,
  };
}
