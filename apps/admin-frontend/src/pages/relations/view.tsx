import { useCallback, useMemo, useState } from "react";
import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import { useApiUrl, useCustom } from "@refinedev/core";
import { EyeOff, GitBranch, Loader2, RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type {
  RelationGraphResponse,
  RelationGraphTable,
} from "@/types/relations.types";
import { TableNode } from "@/components/elk-graph/TableNode";
import { RelationEdge } from "@/components/elk-graph/RelationEdge";
import {
  useElkRelationsGraph,
  type RelationsGraphFocus,
} from "@/lib/use-elk-relations-graph";

const nodeTypes = {
  tableNode: TableNode,
};

const edgeTypes = {
  relationEdge: RelationEdge,
};

function getRelationTableNames(response: RelationGraphResponse | null) {
  if (!response) {
    return new Set<string>();
  }

  return new Set(
    response.relations.flatMap((relation) => [
      relation.sourceTable.name,
      relation.targetTable.name,
    ]),
  );
}

function getTableRelationCount(
  table: RelationGraphTable,
  response: RelationGraphResponse | null,
) {
  if (!response) {
    return 0;
  }

  return response.relations.filter(
    (relation) =>
      relation.sourceTable.name === table.name ||
      relation.targetTable.name === table.name,
  ).length;
}

export function RelationsGraphPage() {
  const apiUrl = useApiUrl();

  const [activeFocus, setActiveFocus] = useState<RelationsGraphFocus>(null);
  const [hiddenTableNames, setHiddenTableNames] = useState<Set<string>>(
    () => new Set(),
  );
  const [search, setSearch] = useState("");

  const {
    query: { data, isLoading, isError, error },
  } = useCustom<RelationGraphResponse>({
    url: `${apiUrl}/relations`,
    method: "get",
  });

  const response = data?.data ?? null;
  const hasGraphFocus = activeFocus !== null;

  const focusRelation = useCallback((relationId: string) => {
    setActiveFocus({
      type: "relation",
      relationId,
    });
  }, []);

  const focusTable = useCallback((tableName: string) => {
    setActiveFocus({
      type: "table",
      tableName,
    });
  }, []);

  const resetFocus = useCallback(() => {
    setActiveFocus(null);
  }, []);

  const graph = useElkRelationsGraph({
    response,
    hiddenTableNames,
    activeFocus,
    onFocusRelation: focusRelation,
    onFocusTable: focusTable,
  });

  const relationTableNames = useMemo(
    () => getRelationTableNames(response),
    [response],
  );

  const tableOptions = useMemo(() => {
    if (!response) {
      return [];
    }

    const normalizedSearch = search.trim().toLowerCase();

    return response.tables
      .filter((table) => relationTableNames.has(table.name))
      .filter((table) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          table.name.toLowerCase().includes(normalizedSearch) ||
          table.label.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        const aCount = getTableRelationCount(a, response);
        const bCount = getTableRelationCount(b, response);

        if (aCount !== bCount) {
          return bCount - aCount;
        }

        return a.label.localeCompare(b.label);
      });
  }, [response, relationTableNames, search]);

  function setTableVisible(tableName: string, visible: boolean) {
    setHiddenTableNames((current) => {
      const next = new Set(current);

      if (visible) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }

      return next;
    });

    resetFocus();
  }

  function showAllTables() {
    setHiddenTableNames(new Set());
    resetFocus();
  }

  function handleGraphContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    resetFocus();
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[680px] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Загружаем граф связей...
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          {error?.message || "Не удалось загрузить граф связей"}
        </CardContent>
      </Card>
    );
  }

  if (!response || response.relations.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[680px] items-center justify-center text-sm text-muted-foreground">
          Связей пока нет. Настройте relation у select/multiselect-полей.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-700">
            <GitBranch className="size-4" />
          </div>

          <div>
            <h1 className="text-xl font-semibold">Связи таблиц</h1>
            <p className="text-sm text-muted-foreground">
              Наведи на связь или таблицу. Сброс выделения — правой кнопкой
              мыши.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            Таблиц:{" "}
            <span className="font-medium text-foreground">
              {graph.visibleTablesCount}
            </span>
            {" · "}
            Связей:{" "}
            <span className="font-medium text-foreground">
              {graph.visibleRelationsCount}
            </span>
          </div>

          {graph.isLayouting ? (
            <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Раскладка...
            </div>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            onClick={showAllTables}
            disabled={hiddenTableNames.size === 0}
          >
            <RotateCcw className="size-4" />
            Показать все
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <EyeOff className="size-4" />
                Скрыть таблицы
                {hiddenTableNames.size > 0 ? ` (${hiddenTableNames.size})` : ""}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[360px] p-0" align="end">
              <div className="border-b p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-9"
                    placeholder="Поиск таблицы..."
                  />
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto p-2">
                {tableOptions.map((table) => {
                  const relationCount = getTableRelationCount(table, response);
                  const visible = !hiddenTableNames.has(table.name);

                  return (
                    <label
                      key={table.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-muted"
                    >
                      <Checkbox
                        checked={visible}
                        onCheckedChange={(checked) =>
                          setTableVisible(table.name, checked === true)
                        }
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {table.label || table.name}
                        </span>

                        <span className="block truncate text-xs text-muted-foreground">
                          {table.name} · {relationCount} связей
                        </span>
                      </span>
                    </label>
                  );
                })}

                {tableOptions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Таблицы не найдены
                  </div>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div
        className="h-[880px] w-full bg-muted/20"
        onContextMenu={handleGraphContextMenu}
      >
        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{
            padding: 0.22,
            includeHiddenNodes: false,
          }}
          minZoom={0.12}
          maxZoom={1.5}
          panOnDrag={!hasGraphFocus}
          zoomOnDoubleClick={!hasGraphFocus}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          proOptions={{
            hideAttribution: true,
          }}
        >
          <Background gap={18} size={1} />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}