import { useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useApiUrl, useCustom } from "@refinedev/core";
import { GitBranch, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type {
  RelationGraphRelation,
  RelationGraphResponse,
  RelationGraphTable,
} from "@/types/relations.types";
import { TableNode, type TableNodeData } from "./components/TableNode";
import { RelationEdge, type RelationEdgeData } from "./components/RelationEdge";

const nodeTypes = {
  tableNode: TableNode,
};

const edgeTypes = {
  relationEdge: RelationEdge,
};

const EDGE_THEMES = [
  {
    color: "#2563eb",
    textColorClassName: "text-blue-700",
    bgClassName: "border-blue-200",
  },
  {
    color: "#16a34a",
    textColorClassName: "text-emerald-700",
    bgClassName: "border-emerald-200",
  },
  {
    color: "#7c3aed",
    textColorClassName: "text-violet-700",
    bgClassName: "border-violet-200",
  },
  {
    color: "#db2777",
    textColorClassName: "text-pink-700",
    bgClassName: "border-pink-200",
  },
  {
    color: "#ea580c",
    textColorClassName: "text-orange-700",
    bgClassName: "border-orange-200",
  },
];

const NODE_ACCENTS = [
  "bg-blue-50",
  "bg-emerald-50",
  "bg-violet-50",
  "bg-orange-50",
  "bg-pink-50",
  "bg-cyan-50",
];

const NODE_WIDTH = 320;
const NODE_BASE_HEIGHT = 130;
const FIELD_ROW_HEIGHT = 42;

const COLUMN_GAP = 420;
const ROW_GAP = 90;
const COLUMN_START_X = 40;
const START_Y = 40;

function getNodeHeight(table: RelationGraphTable) {
  return NODE_BASE_HEIGHT + Math.min(table.fields.length, 8) * FIELD_ROW_HEIGHT;
}

function getVisibleTables(params: {
  tables: RelationGraphTable[];
  relations: RelationGraphRelation[];
}) {
  const relatedTableNames = new Set(
    params.relations.flatMap((relation) => [
      relation.sourceTable.name,
      relation.targetTable.name,
    ]),
  );

  return params.tables.filter((table) => relatedTableNames.has(table.name));
}

function chunkTables<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function buildRelationsGraph(params: {
  tables: RelationGraphTable[];
  relations: RelationGraphRelation[];
}) {
  const { tables, relations } = params;

  const visibleTables = getVisibleTables({ tables, relations });

  const incomingCount = new Map<string, number>();
  const outgoingCount = new Map<string, number>();

  for (const table of visibleTables) {
    incomingCount.set(table.name, 0);
    outgoingCount.set(table.name, 0);
  }

  for (const relation of relations) {
    outgoingCount.set(
      relation.sourceTable.name,
      (outgoingCount.get(relation.sourceTable.name) ?? 0) + 1,
    );

    incomingCount.set(
      relation.targetTable.name,
      (incomingCount.get(relation.targetTable.name) ?? 0) + 1,
    );
  }

  const sourceOnly: RelationGraphTable[] = [];
  const mixed: RelationGraphTable[] = [];
  const targetOnly: RelationGraphTable[] = [];

  for (const table of visibleTables) {
    const incoming = incomingCount.get(table.name) ?? 0;
    const outgoing = outgoingCount.get(table.name) ?? 0;

    if (outgoing > 0 && incoming === 0) {
      sourceOnly.push(table);
      continue;
    }

    if (incoming > 0 && outgoing === 0) {
      targetOnly.push(table);
      continue;
    }

    mixed.push(table);
  }

  const sortByWeight = (a: RelationGraphTable, b: RelationGraphTable) => {
    const aIncoming = incomingCount.get(a.name) ?? 0;
    const aOutgoing = outgoingCount.get(a.name) ?? 0;
    const bIncoming = incomingCount.get(b.name) ?? 0;
    const bOutgoing = outgoingCount.get(b.name) ?? 0;

    const aWeight = aIncoming + aOutgoing * 0.7;
    const bWeight = bIncoming + bOutgoing * 0.7;

    return bWeight - aWeight;
  };

  sourceOnly.sort(sortByWeight);
  mixed.sort(sortByWeight);
  targetOnly.sort(sortByWeight);

  /**
   * Чтобы колонка не вытягивалась слишком сильно по вертикали,
   * разбиваем большие группы на подколонки.
   */
  const leftColumns = chunkTables(sourceOnly, 4);
  const centerColumns = chunkTables(mixed, 4);
  const rightColumns = chunkTables(targetOnly, 4);

  const columnGroups = [
    ...leftColumns.map((tables) => ({ side: "left" as const, tables })),
    ...centerColumns.map((tables) => ({ side: "center" as const, tables })),
    ...rightColumns.map((tables) => ({ side: "right" as const, tables })),
  ];

  const leftBaseX = COLUMN_START_X;
  const centerBaseX =
    leftBaseX + Math.max(leftColumns.length, 1) * COLUMN_GAP + 140;
  const rightBaseX =
    centerBaseX + Math.max(centerColumns.length, 1) * COLUMN_GAP + 140;

  let leftOffset = 0;
  let centerOffset = 0;
  let rightOffset = 0;

  const nodes: Node<TableNodeData>[] = [];

  for (const group of columnGroups) {
    let columnX = 0;

    if (group.side === "left") {
      columnX = leftBaseX + leftOffset * COLUMN_GAP;
      leftOffset += 1;
    } else if (group.side === "center") {
      columnX = centerBaseX + centerOffset * COLUMN_GAP;
      centerOffset += 1;
    } else {
      columnX = rightBaseX + rightOffset * COLUMN_GAP;
      rightOffset += 1;
    }

    let currentY = START_Y;

    for (const table of group.tables) {
      const tableHeight = getNodeHeight(table);

      nodes.push({
        id: table.name,
        type: "tableNode",
        position: {
          x: columnX,
          y: currentY,
        },
        data: {
          table,
          relations,
          accentClassName: NODE_ACCENTS[nodes.length % NODE_ACCENTS.length],
        },
      });

      currentY += tableHeight + ROW_GAP;
    }
  }

  const edges: Edge<RelationEdgeData>[] = relations.map((relation, index) => {
    const theme = EDGE_THEMES[index % EDGE_THEMES.length];

    return {
      id: relation.id,
      type: "relationEdge",
      source: relation.sourceTable.name,
      target: relation.targetTable.name,
      sourceHandle: relation.sourceHandle,
      targetHandle: relation.targetHandle,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: theme.color,
        width: 16,
        height: 16,
      },
      data: {
        relation,
        color: theme.color,
        textColorClassName: theme.textColorClassName,
        bgClassName: theme.bgClassName,
      },
    };
  });

  return { nodes, edges };
}

export function RelationsGraphPage() {
  const apiUrl = useApiUrl();

  const {
    query: { data, isLoading, isError, error },
  } = useCustom<RelationGraphResponse>({
    url: `${apiUrl}/relations`,
    method: "get",
  });

  const tables = data?.data?.tables ?? [];
  const relations = data?.data?.relations ?? [];

  const { nodes, edges } = useMemo(
    () =>
      buildRelationsGraph({
        tables,
        relations,
      }),
    [tables, relations],
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-170 items-center justify-center gap-2 text-sm text-muted-foreground">
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

  if (relations.length === 0) {
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
      <div className="flex items-center gap-4 border-b px-6 py-4">
        <div className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-700">
          <GitBranch className="size-4" />
        </div>

        <div>
          <h1 className="text-xl font-semibold">Связи таблиц</h1>
          <p className="text-sm text-muted-foreground">
            Relation-поля, target key и display value показаны прямо на графе.
          </p>
        </div>
      </div>

      <div className="h-[900px] w-full bg-muted/20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{
            padding: 0.2,
          }}
          minZoom={0.2}
          maxZoom={1.5}
          nodesDraggable
          nodesConnectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={18} size={1} />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
