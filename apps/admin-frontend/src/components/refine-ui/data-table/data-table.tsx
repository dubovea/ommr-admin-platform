"use client";

import type { BaseRecord, HttpError } from "@refinedev/core";
import type { UseTableReturnType } from "@refinedev/react-table";
import type { Column, Row } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { DataTablePagination } from "@/components/refine-ui/data-table/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps<TData extends BaseRecord> = {
  table: UseTableReturnType<TData, HttpError>;
  onRowClick?: (row: TData) => void;
};

export function DataTable<TData extends BaseRecord>({
  table,
  onRowClick,
}: DataTableProps<TData>) {
  const {
    reactTable: {
      getHeaderGroups,
      getRowModel,
      getAllColumns,
      getVisibleLeafColumns,
    },
    refineCore: {
      tableQuery,
      currentPage,
      setCurrentPage,
      pageCount,
      pageSize,
      setPageSize,
    },
  } = table;

  const columns = getAllColumns();
  const leafColumns = getVisibleLeafColumns();
  const isLoading = tableQuery.isLoading;

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const [isOverflowing, setIsOverflowing] = useState({
    horizontal: false,
    vertical: false,
  });

  useEffect(() => {
    const checkOverflow = () => {
      if (tableRef.current && tableContainerRef.current) {
        const tableElement = tableRef.current;
        const container = tableContainerRef.current;

        const horizontalOverflow =
          tableElement.offsetWidth > container.clientWidth;
        const verticalOverflow =
          tableElement.offsetHeight > container.clientHeight;

        setIsOverflowing({
          horizontal: horizontalOverflow,
          vertical: verticalOverflow,
        });
      }
    };

    checkOverflow();

    window.addEventListener("resize", checkOverflow);

    const timeoutId = window.setTimeout(checkOverflow, 100);

    return () => {
      window.removeEventListener("resize", checkOverflow);
      window.clearTimeout(timeoutId);
    };
  }, [tableQuery.data?.data, pageSize, getRowModel().rows.length]);

  const rows = getRowModel().rows;
  const visibleColumnsCount = Math.max(leafColumns.length, 1);
  const shouldShowPagination =
    !isLoading && rows.length > 0 && Number(pageCount) > 1;

  return (
    <div className={cn("flex flex-1 flex-col gap-4")}>
      <div ref={tableContainerRef} className={cn("rounded-md border")}>
        <Table ref={tableRef} style={{ tableLayout: "fixed", width: "100%" }}>
          <TableHeader>
            {getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isPlaceholder = header.isPlaceholder;

                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        ...getCommonStyles({
                          column: header.column,
                          isOverflowing,
                        }),
                      }}
                    >
                      {isPlaceholder ? null : (
                        <div className={cn("flex items-center gap-1")}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody className="relative">
            {isLoading ? (
              <>
                {Array.from({ length: pageSize < 1 ? 1 : pageSize }).map(
                  (_, rowIndex) => (
                    <TableRow
                      key={`skeleton-row-${rowIndex}`}
                      aria-hidden="true"
                    >
                      {leafColumns.map((column) => (
                        <TableCell
                          key={`skeleton-cell-${rowIndex}-${column.id}`}
                          style={{
                            ...getCommonStyles({
                              column,
                              isOverflowing,
                            }),
                          }}
                          className={cn("truncate")}
                        >
                          <div className="h-8" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ),
                )}

                <TableRow>
                  <TableCell
                    colSpan={visibleColumnsCount}
                    className={cn("pointer-events-none absolute inset-0")}
                  >
                    <Loader2
                      className={cn(
                        "absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-spin text-primary",
                      )}
                    />
                  </TableCell>
                </TableRow>
              </>
            ) : rows.length ? (
              rows.map((row) => (
                <DataTableBodyRow
                  key={row.id}
                  row={row}
                  isOverflowing={isOverflowing}
                  visibleColumnsCount={visibleColumnsCount}
                  onRowClick={onRowClick}
                />
              ))
            ) : (
              <DataTableNoData
                isOverflowing={isOverflowing}
                columnsLength={visibleColumnsCount}
              />
            )}
          </TableBody>
        </Table>
      </div>

      {shouldShowPagination && (
        <DataTablePagination
          currentPage={currentPage}
          pageCount={pageCount}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          total={tableQuery.data?.total}
        />
      )}
    </div>
  );
}

function DataTableBodyRow<TData extends BaseRecord>({
  row,
  isOverflowing,
  visibleColumnsCount,
  onRowClick,
}: {
  row: Row<TData>;
  isOverflowing: {
    horizontal: boolean;
    vertical: boolean;
  };
  visibleColumnsCount: number;
  onRowClick?: (row: TData) => void;
}) {
  if (row.getIsGrouped()) {
    const groupValue = getGroupedRowValue(row);
    const leafRowsCount = row.getLeafRows().length;

    return (
      <TableRow className="bg-muted/60 hover:bg-muted/60">
        <TableCell colSpan={visibleColumnsCount} className="h-11 py-2">
          <button
            type="button"
            className="flex w-full items-center gap-2 text-left text-sm font-semibold"
            onClick={row.getToggleExpandedHandler()}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}

            <span>{groupValue}</span>

            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {leafRowsCount}
            </span>
          </button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow
      key={row.original?.id ?? row.id}
      data-state={row.getIsSelected() && "selected"}
      className={cn(
        onRowClick && "cursor-pointer",
        row.getIsSelected() &&
          "bg-blue-50 hover:bg-blue-50 shadow-[inset_3px_0_0_#2563eb]",
      )}
      onClick={() => onRowClick?.(row.original)}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          style={{
            ...getCommonStyles({
              column: cell.column,
              isOverflowing,
            }),
          }}
        >
          <div className="truncate">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        </TableCell>
      ))}
    </TableRow>
  );
}

function getGroupedRowValue<TData extends BaseRecord>(row: Row<TData>) {
  const groupedCell = row
    .getVisibleCells()
    .find((cell) => cell.getIsGrouped());

  const groupingColumnId = row.groupingColumnId;
  const value =
    groupedCell?.getValue() ??
    (groupingColumnId ? row.getValue(groupingColumnId) : undefined) ??
    row.groupingValue;

  return value === null || value === undefined || value === ""
    ? "Без группы"
    : String(value);
}

function DataTableNoData({
  isOverflowing,
  columnsLength,
}: {
  isOverflowing: { horizontal: boolean; vertical: boolean };
  columnsLength: number;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell
        colSpan={columnsLength}
        className={cn("relative text-center")}
        style={{ height: "490px" }}
      >
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background",
          )}
          style={{
            position: isOverflowing.horizontal ? "sticky" : "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: isOverflowing.horizontal ? 2 : 1,
            width: isOverflowing.horizontal ? "fit-content" : "100%",
            minWidth: "300px",
          }}
        >
          <div className={cn("text-lg font-semibold text-foreground")}>
            No data to display
          </div>

          <div className={cn("text-sm text-muted-foreground")}>
            This table is empty for the time being.
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function getCommonStyles<TData>({
  column,
  isOverflowing,
}: {
  column: Column<TData>;
  isOverflowing: {
    horizontal: boolean;
    vertical: boolean;
  };
}): React.CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn =
    isPinned === "left" && column.getIsLastColumn("left");
  const isFirstRightPinnedColumn =
    isPinned === "right" && column.getIsFirstColumn("right");

  return {
    boxShadow:
      isOverflowing.horizontal && isLastLeftPinnedColumn
        ? "-4px 0 4px -4px var(--border) inset"
        : isOverflowing.horizontal && isFirstRightPinnedColumn
          ? "4px 0 4px -4px var(--border) inset"
          : undefined,
    left:
      isOverflowing.horizontal && isPinned === "left"
        ? `${column.getStart("left")}px`
        : undefined,
    right:
      isOverflowing.horizontal && isPinned === "right"
        ? `${column.getAfter("right")}px`
        : undefined,
    opacity: 1,
    position: isOverflowing.horizontal && isPinned ? "sticky" : "relative",
    background: isOverflowing.horizontal && isPinned ? "var(--background)" : "",
    borderTopRightRadius:
      isOverflowing.horizontal && isPinned === "right"
        ? "var(--radius)"
        : undefined,
    borderBottomRightRadius:
      isOverflowing.horizontal && isPinned === "right"
        ? "var(--radius)"
        : undefined,
    borderTopLeftRadius:
      isOverflowing.horizontal && isPinned === "left"
        ? "var(--radius)"
        : undefined,
    borderBottomLeftRadius:
      isOverflowing.horizontal && isPinned === "left"
        ? "var(--radius)"
        : undefined,
    width: column.getSize(),
    zIndex: isOverflowing.horizontal && isPinned ? 1 : 0,
  };
}

DataTable.displayName = "DataTable";