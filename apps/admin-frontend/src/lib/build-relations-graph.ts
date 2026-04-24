import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type {
  RelationGraphRelation,
  RelationGraphResponse,
  RelationGraphTable,
} from "@/types/relations.types";

export type TableNodeData = {
  table: RelationGraphTable;
  relations: RelationGraphRelation[];
  isDimmed: boolean;
  isHighlighted: boolean;
};

export type RelationEdgeData = {
  relation: RelationGraphRelation;
  color: string;
  laneOffset: number;
  isDimmed: boolean;
  isHighlighted: boolean;
  onFocusRelation?: (relationId: string) => void;
  onBlurRelation?: () => void;
};

const EDGE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#0891b2",
  "#4f46e5",
  "#059669",
];

const NODE_WIDTH = 340;
const NODE_BASE_HEIGHT = 92;
const FIELD_ROW_HEIGHT = 34;
const MAX_VISIBLE_FIELDS = 8;

const NODE_COLUMN_STEP = 470;
const NODE_ROW_GAP = 72;

const CLUSTER_GAP_X = 180;
const CLUSTER_GAP_Y = 150;
const MAX_ROW_WIDTH = 2500;

const START_X = 80;
const START_Y = 80;

function getNodeHeight(table: RelationGraphTable) {
  return (
    NODE_BASE_HEIGHT +
    Math.min(table.fields.length, MAX_VISIBLE_FIELDS) * FIELD_ROW_HEIGHT
  );
}

function getIncomingCount(relations: RelationGraphRelation[]) {
  const result = new Map<string, number>();

  for (const relation of relations) {
    result.set(
      relation.targetTable.name,
      (result.get(relation.targetTable.name) ?? 0) + 1,
    );
  }

  return result;
}

function getOutgoingCount(relations: RelationGraphRelation[]) {
  const result = new Map<string, number>();

  for (const relation of relations) {
    result.set(
      relation.sourceTable.name,
      (result.get(relation.sourceTable.name) ?? 0) + 1,
    );
  }

  return result;
}

function getRelatedTableNames(relations: RelationGraphRelation[]) {
  return new Set(
    relations.flatMap((relation) => [
      relation.sourceTable.name,
      relation.targetTable.name,
    ]),
  );
}

function getVisibleData(params: {
  response: RelationGraphResponse;
  hiddenTableNames: Set<string>;
}) {
  const { response, hiddenTableNames } = params;

  const relations = response.relations.filter(
    (relation) =>
      !hiddenTableNames.has(relation.sourceTable.name) &&
      !hiddenTableNames.has(relation.targetTable.name),
  );

  const relatedTableNames = getRelatedTableNames(relations);

  const tables = response.tables.filter(
    (table) =>
      !hiddenTableNames.has(table.name) && relatedTableNames.has(table.name),
  );

  return {
    tables,
    relations,
  };
}

function getPrimaryTargetForSource(params: {
  sourceTableName: string;
  relations: RelationGraphRelation[];
  incomingCount: Map<string, number>;
}) {
  const { sourceTableName, relations, incomingCount } = params;

  const outgoing = relations.filter(
    (relation) => relation.sourceTable.name === sourceTableName,
  );

  if (outgoing.length === 0) {
    return null;
  }

  return (
    [...outgoing].sort((a, b) => {
      const aIncoming = incomingCount.get(a.targetTable.name) ?? 0;
      const bIncoming = incomingCount.get(b.targetTable.name) ?? 0;

      if (aIncoming !== bIncoming) {
        return bIncoming - aIncoming;
      }

      return a.targetTable.name.localeCompare(b.targetTable.name);
    })[0]?.targetTable.name ?? null
  );
}

function chunkTables<T>(items: T[], maxPerColumn: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += maxPerColumn) {
    chunks.push(items.slice(index, index + maxPerColumn));
  }

  return chunks;
}

function getColumnHeight(tables: RelationGraphTable[]) {
  if (tables.length === 0) {
    return 0;
  }

  return tables.reduce((sum, table, index) => {
    return sum + getNodeHeight(table) + (index === 0 ? 0 : NODE_ROW_GAP);
  }, 0);
}

function getCenteredLaneOffset(index: number, total: number) {
  if (total <= 1) {
    return 0;
  }

  const gap = total > 8 ? 16 : 24;

  return (index - (total - 1) / 2) * gap;
}

function getLaneOffsets(relations: RelationGraphRelation[]) {
  const groupMap = new Map<string, RelationGraphRelation[]>();

  for (const relation of relations) {
    const key = `${relation.targetTable.name}:${relation.targetField.name}`;
    const list = groupMap.get(key) ?? [];

    list.push(relation);
    groupMap.set(key, list);
  }

  const offsets = new Map<string, number>();

  for (const group of groupMap.values()) {
    group.forEach((relation, index) => {
      offsets.set(relation.id, getCenteredLaneOffset(index, group.length));
    });
  }

  return offsets;
}

type Cluster = {
  targetTable: RelationGraphTable;
  sourceTables: RelationGraphTable[];
  width: number;
  height: number;
};

function buildClusters(params: {
  tables: RelationGraphTable[];
  relations: RelationGraphRelation[];
}) {
  const { tables, relations } = params;

  const tableByName = new Map(tables.map((table) => [table.name, table]));

  const incomingCount = getIncomingCount(relations);
  const outgoingCount = getOutgoingCount(relations);

  const targetTableNames = [
    ...new Set(relations.map((relation) => relation.targetTable.name)),
  ]
    .filter((tableName) => tableByName.has(tableName))
    .sort((a, b) => {
      const aIncoming = incomingCount.get(a) ?? 0;
      const bIncoming = incomingCount.get(b) ?? 0;

      if (aIncoming !== bIncoming) {
        return bIncoming - aIncoming;
      }

      return a.localeCompare(b);
    });

  const clustersMap = new Map<string, Cluster>();

  for (const targetTableName of targetTableNames) {
    const targetTable = tableByName.get(targetTableName);

    if (!targetTable) {
      continue;
    }

    clustersMap.set(targetTableName, {
      targetTable,
      sourceTables: [],
      width: 0,
      height: 0,
    });
  }

  const targetTableNameSet = new Set(targetTableNames);

  const sourceOnlyTables = tables.filter((table) => {
    const incoming = incomingCount.get(table.name) ?? 0;
    const outgoing = outgoingCount.get(table.name) ?? 0;

    return outgoing > 0 && incoming === 0;
  });

  for (const sourceTable of sourceOnlyTables) {
    const primaryTarget = getPrimaryTargetForSource({
      sourceTableName: sourceTable.name,
      relations,
      incomingCount,
    });

    if (!primaryTarget) {
      continue;
    }

    const cluster = clustersMap.get(primaryTarget);

    if (!cluster) {
      continue;
    }

    cluster.sourceTables.push(sourceTable);
  }

  /**
   * Таблицы, которые одновременно target и source, оставляем как target в своём кластере.
   * Так мы избегаем дублирования одной таблицы в нескольких местах.
   */
  const notPlacedTables = tables.filter((table) => {
    if (targetTableNameSet.has(table.name)) {
      return false;
    }

    return !sourceOnlyTables.some(
      (sourceTable) => sourceTable.name === table.name,
    );
  });

  if (notPlacedTables.length > 0) {
    const fallbackTarget = notPlacedTables[0];

    clustersMap.set("__other__", {
      targetTable: fallbackTarget,
      sourceTables: notPlacedTables.slice(1),
      width: 0,
      height: 0,
    });
  }

  const clusters = [...clustersMap.values()];

  for (const cluster of clusters) {
    cluster.sourceTables.sort((a, b) => {
      const aOutgoing = outgoingCount.get(a.name) ?? 0;
      const bOutgoing = outgoingCount.get(b.name) ?? 0;

      if (aOutgoing !== bOutgoing) {
        return bOutgoing - aOutgoing;
      }

      return a.label.localeCompare(b.label);
    });

    const sourceColumns = chunkTables(cluster.sourceTables, 3);
    const sourceColumnsCount = Math.max(sourceColumns.length, 1);

    const sourcesHeight = Math.max(
      0,
      ...sourceColumns.map((column) => getColumnHeight(column)),
    );

    const targetHeight = getNodeHeight(cluster.targetTable);

    cluster.width =
      (sourceColumnsCount + 1) * NODE_WIDTH +
      sourceColumnsCount * (NODE_COLUMN_STEP - NODE_WIDTH);
    cluster.height = Math.max(sourcesHeight, targetHeight);
  }

  return clusters.sort((a, b) => {
    const aIncoming = incomingCount.get(a.targetTable.name) ?? 0;
    const bIncoming = incomingCount.get(b.targetTable.name) ?? 0;

    if (aIncoming !== bIncoming) {
      return bIncoming - aIncoming;
    }

    return a.targetTable.label.localeCompare(b.targetTable.label);
  });
}

function placeClusters(clusters: Cluster[]) {
  const positions = new Map<string, { x: number; y: number }>();

  let currentX = START_X;
  let currentY = START_Y;
  let rowHeight = 0;

  for (const cluster of clusters) {
    if (currentX > START_X && currentX + cluster.width > MAX_ROW_WIDTH) {
      currentX = START_X;
      currentY += rowHeight + CLUSTER_GAP_Y;
      rowHeight = 0;
    }

    const sourceColumns = chunkTables(cluster.sourceTables, 3);
    const sourceColumnsCount = sourceColumns.length;

    const sourcesHeight = Math.max(
      0,
      ...sourceColumns.map((column) => getColumnHeight(column)),
    );

    const targetHeight = getNodeHeight(cluster.targetTable);

    sourceColumns.forEach((column, columnIndex) => {
      const columnHeight = getColumnHeight(column);
      let y = currentY + Math.max(0, (cluster.height - columnHeight) / 2);

      for (const sourceTable of column) {
        positions.set(sourceTable.name, {
          x: currentX + columnIndex * NODE_COLUMN_STEP,
          y,
        });

        y += getNodeHeight(sourceTable) + NODE_ROW_GAP;
      }
    });

    const targetX = currentX + sourceColumnsCount * NODE_COLUMN_STEP;

    positions.set(cluster.targetTable.name, {
      x: targetX,
      y: currentY + Math.max(0, (cluster.height - targetHeight) / 2),
    });

    currentX += cluster.width + CLUSTER_GAP_X;
    rowHeight = Math.max(rowHeight, cluster.height);
  }

  return positions;
}

export function buildRelationsGraph(params: {
  response: RelationGraphResponse;
  hiddenTableNames: Set<string>;
  activeRelationId: string | null;
  onFocusRelation: (relationId: string) => void;
  onBlurRelation: () => void;
}) {
  const {
    response,
    hiddenTableNames,
    activeRelationId,
    onFocusRelation,
    onBlurRelation,
  } = params;

  const { tables, relations } = getVisibleData({
    response,
    hiddenTableNames,
  });

  const clusters = buildClusters({ tables, relations });
  const positions = placeClusters(clusters);
  const laneOffsets = getLaneOffsets(relations);

  const activeRelation =
    activeRelationId !== null
      ? (relations.find((relation) => relation.id === activeRelationId) ?? null)
      : null;

  const highlightedTableNames = new Set<string>(
    activeRelation
      ? [activeRelation.sourceTable.name, activeRelation.targetTable.name]
      : [],
  );

  const nodes: Node<TableNodeData>[] = tables.map((table) => {
    const position = positions.get(table.name) ?? {
      x: START_X,
      y: START_Y,
    };

    const isHighlighted = highlightedTableNames.has(table.name);
    const isDimmed = activeRelationId !== null && !isHighlighted;

    return {
      id: table.name,
      type: "tableNode",
      position,
      data: {
        table,
        relations,
        isDimmed,
        isHighlighted,
      },
      draggable: false,
      selectable: false,
    };
  });

  const edges: Edge<RelationEdgeData>[] = relations.map((relation, index) => {
    const color = EDGE_COLORS[index % EDGE_COLORS.length];

    const isHighlighted = activeRelationId === relation.id;
    const isDimmed = activeRelationId !== null && !isHighlighted;

    return {
      id: relation.id,
      type: "relationEdge",
      source: relation.sourceTable.name,
      target: relation.targetTable.name,
      sourceHandle: relation.sourceHandle,
      targetHandle: relation.targetHandle,
      selectable: false,
      animated: isHighlighted,
      zIndex: isHighlighted ? 1000 : 10,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
        width: 16,
        height: 16,
      },
      data: {
        relation,
        color,
        laneOffset: laneOffsets.get(relation.id) ?? 0,
        isDimmed,
        isHighlighted,
        onFocusRelation,
        onBlurRelation,
      },
    };
  });

  return {
    nodes,
    edges,
    visibleTablesCount: tables.length,
    visibleRelationsCount: relations.length,
  };
}
