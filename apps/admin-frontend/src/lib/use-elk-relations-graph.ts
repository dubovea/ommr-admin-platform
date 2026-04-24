// apps/admin-frontend/src/pages/relations/lib/use-elk-relations-graph.ts
import { useEffect, useMemo, useState } from "react";
import ELK from "elkjs/lib/elk.bundled.js";
import { MarkerType, type Edge, type Node } from "@xyflow/react";

import type {
  RelationGraphRelation,
  RelationGraphResponse,
  RelationGraphTable,
} from "../types";
import type { TableNodeData } from "../components/TableNode";
import type { RelationEdgeData, RelationEdgePoint } from "../components/RelationEdge";
import {
  FIELD_ROW_HEIGHT,
  getFieldCenterY,
  getGraphFields,
  getHiddenFieldsCount,
  getNodeHeight,
  getSourceHandle,
  getTableSourceFields,
  getTableTargetFields,
  getTargetHandle,
  NODE_WIDTH,
} from "./relation-graph-model";

type ElkPort = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: Record<string, string>;
};

type ElkNodeShape = {
  id: string;
  width: number;
  height: number;
  ports?: ElkPort[];
  properties?: Record<string, string>;
};

type ElkEdgeSection = {
  id?: string;
  startPoint: RelationEdgePoint;
  endPoint: RelationEdgePoint;
  bendPoints?: RelationEdgePoint[];
};

type ElkEdgeShape = {
  id: string;
  sources: string[];
  targets: string[];
  sections?: ElkEdgeSection[];
  labels?: Array<{
    text: string;
    width: number;
    height: number;
    x?: number;
    y?: number;
  }>;
};

type ElkGraph = {
  id: string;
  layoutOptions: Record<string, string>;
  children: ElkNodeShape[];
  edges: ElkEdgeShape[];
};

type ElkLayoutedNode = ElkNodeShape & {
  x?: number;
  y?: number;
};

type ElkLayoutedGraph = ElkGraph & {
  children: ElkLayoutedNode[];
  edges: ElkEdgeShape[];
};

const elk = new ELK();

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

  const relatedTableNames = new Set(
    relations.flatMap((relation) => [
      relation.sourceTable.name,
      relation.targetTable.name,
    ]),
  );

  const tables = response.tables.filter(
    (table) => !hiddenTableNames.has(table.name) && relatedTableNames.has(table.name),
  );

  return {
    tables,
    relations,
  };
}

function getRelationLabel(relation: RelationGraphRelation) {
  return `${relation.sourceField.name} → ${relation.targetTable.name}.${relation.relation.targetKey}`;
}

function getEdgePoints(edge: ElkEdgeShape): RelationEdgePoint[] {
  const section = edge.sections?.[0];

  if (!section) {
    return [];
  }

  return [
    section.startPoint,
    ...(section.bendPoints ?? []),
    section.endPoint,
  ];
}

function getPortIndex(params: {
  table: RelationGraphTable;
  relations: RelationGraphRelation[];
  fieldName: string;
}) {
  const fields = getGraphFields(params.table, params.relations);

  return Math.max(
    0,
    fields.findIndex((field) => field.name === params.fieldName),
  );
}

function buildElkPorts(params: {
  table: RelationGraphTable;
  relations: RelationGraphRelation[];
}) {
  const { table, relations } = params;

  const sourceFieldNames = getTableSourceFields(table.name, relations);
  const targetFieldNames = getTableTargetFields(table.name, relations);

  const fieldsWithPorts = new Set<string>([
    ...sourceFieldNames,
    ...targetFieldNames,
  ]);

  const ports: ElkPort[] = [];

  for (const fieldName of fieldsWithPorts) {
    const centerY = getFieldCenterY({
      table,
      relations,
      fieldName,
    });

    const portIndex = getPortIndex({
      table,
      relations,
      fieldName,
    });

    ports.push({
      id: getTargetHandle(table.name, fieldName),
      x: -6,
      y: centerY - 5,
      width: 10,
      height: 10,
      properties: {
        "org.eclipse.elk.port.side": "WEST",
        "org.eclipse.elk.port.index": String(portIndex),
      },
    });

    ports.push({
      id: getSourceHandle(table.name, fieldName),
      x: NODE_WIDTH - 4,
      y: centerY - 5,
      width: 10,
      height: 10,
      properties: {
        "org.eclipse.elk.port.side": "EAST",
        "org.eclipse.elk.port.index": String(portIndex),
      },
    });
  }

  return ports;
}

function buildElkGraph(params: {
  tables: RelationGraphTable[];
  relations: RelationGraphRelation[];
}): ElkGraph {
  const { tables, relations } = params;

  return {
    id: "relations-root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",

      /**
       * Эти настройки сильно важнее ручных отступов:
       * ELK пытается минимизировать пересечения и разводить линии по каналам.
       */
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.layering.strategy": "NETWORK_SIMPLEX",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",

      /**
       * Отступы умеренные: не огромные, но достаточно, чтобы линии не были кашей.
       */
      "elk.spacing.nodeNode": "70",
      "elk.spacing.edgeEdge": "24",
      "elk.spacing.edgeNode": "36",
      "elk.spacing.edgeLabel": "18",
      "elk.layered.spacing.nodeNodeBetweenLayers": "170",
      "elk.layered.spacing.edgeNodeBetweenLayers": "44",
      "elk.layered.spacing.edgeEdgeBetweenLayers": "30",

      /**
       * Когда много входящих связей в один target, это помогает не сваливать
       * всё в один вертикальный пучок.
       */
      "elk.layered.mergeEdges": "false",
      "elk.layered.feedbackEdges": "true",
      "elk.layered.unnecessaryBendpoints": "true",
      "elk.layered.thoroughness": "20",
    },

    children: tables.map((table) => ({
      id: table.name,
      width: NODE_WIDTH,
      height: getNodeHeight(table, relations),
      ports: buildElkPorts({
        table,
        relations,
      }),
      properties: {
        "org.eclipse.elk.portConstraints": "FIXED_POS",
      },
    })),

    edges: relations.map((relation) => ({
      id: relation.id,
      sources: [relation.sourceHandle],
      targets: [relation.targetHandle],
      labels: [
        {
          text: getRelationLabel(relation),
          width: 150,
          height: 34,
        },
      ],
    })),
  };
}

function getHighlightedTableNames(
  relations: RelationGraphRelation[],
  activeRelationId: string | null,
) {
  if (!activeRelationId) {
    return new Set<string>();
  }

  const activeRelation = relations.find(
    (relation) => relation.id === activeRelationId,
  );

  if (!activeRelation) {
    return new Set<string>();
  }

  return new Set([
    activeRelation.sourceTable.name,
    activeRelation.targetTable.name,
  ]);
}

export function useElkRelationsGraph(params: {
  response: RelationGraphResponse | null;
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

  const [isLayouting, setIsLayouting] = useState(false);
  const [layoutedGraph, setLayoutedGraph] = useState<ElkLayoutedGraph | null>(
    null,
  );

  const visibleData = useMemo(() => {
    if (!response) {
      return {
        tables: [],
        relations: [],
      };
    }

    return getVisibleData({
      response,
      hiddenTableNames,
    });
  }, [response, hiddenTableNames]);

  useEffect(() => {
    if (!response) {
      setLayoutedGraph(null);
      return;
    }

    let cancelled = false;

    async function layout() {
      setIsLayouting(true);

      try {
        const elkGraph = buildElkGraph(visibleData);
        const result = (await elk.layout(elkGraph)) as ElkLayoutedGraph;

        if (!cancelled) {
          setLayoutedGraph(result);
        }
      } finally {
        if (!cancelled) {
          setIsLayouting(false);
        }
      }
    }

    void layout();

    return () => {
      cancelled = true;
    };
  }, [response, visibleData]);

  const result = useMemo(() => {
    if (!layoutedGraph) {
      return {
        nodes: [] as Node<TableNodeData>[],
        edges: [] as Edge<RelationEdgeData>[],
        visibleTablesCount: 0,
        visibleRelationsCount: 0,
      };
    }

    const layoutedNodeById = new Map(
      layoutedGraph.children.map((node) => [node.id, node]),
    );

    const layoutedEdgeById = new Map(
      layoutedGraph.edges.map((edge) => [edge.id, edge]),
    );

    const highlightedTableNames = getHighlightedTableNames(
      visibleData.relations,
      activeRelationId,
    );

    const nodes: Node<TableNodeData>[] = visibleData.tables.map((table) => {
      const layoutedNode = layoutedNodeById.get(table.name);

      const isHighlighted = highlightedTableNames.has(table.name);
      const isDimmed = activeRelationId !== null && !isHighlighted;

      return {
        id: table.name,
        type: "tableNode",
        position: {
          x: layoutedNode?.x ?? 0,
          y: layoutedNode?.y ?? 0,
        },
        data: {
          table,
          relations: visibleData.relations,
          isDimmed,
          isHighlighted,
        },
        draggable: false,
        selectable: false,
      };
    });

    const edges: Edge<RelationEdgeData>[] = visibleData.relations.map(
      (relation, index) => {
        const color = EDGE_COLORS[index % EDGE_COLORS.length];
        const layoutedEdge = layoutedEdgeById.get(relation.id);

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
          animated: false,
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
            points: layoutedEdge ? getEdgePoints(layoutedEdge) : [],
            isDimmed,
            isHighlighted,
            onFocusRelation,
            onBlurRelation,
          },
        };
      },
    );

    return {
      nodes,
      edges,
      visibleTablesCount: visibleData.tables.length,
      visibleRelationsCount: visibleData.relations.length,
    };
  }, [
    layoutedGraph,
    visibleData,
    activeRelationId,
    onFocusRelation,
    onBlurRelation,
  ]);

  return {
    ...result,
    isLayouting,
  };
}