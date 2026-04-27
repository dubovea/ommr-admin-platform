import {
  BaseEdge,
  EdgeLabelRenderer,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { Link2 } from "lucide-react";

import type { RelationGraphRelation } from "@/types/relations.types";

export type RelationEdgePoint = {
  x: number;
  y: number;
};

export type RelationEdgeData = {
  relation: RelationGraphRelation;
  color: string;
  points: RelationEdgePoint[];
  isDimmed: boolean;
  isHighlighted: boolean;
  onFocusRelation?: (relationId: string) => void;
};

export type RelationEdgeType = Edge<RelationEdgeData, "relationEdge">;

function getPathFromPoints(points: RelationEdgePoint[]) {
  if (points.length === 0) {
    return "";
  }

  const [firstPoint, ...rest] = points;

  return [
    `M ${firstPoint.x},${firstPoint.y}`,
    ...rest.map((point) => `L ${point.x},${point.y}`),
  ].join(" ");
}

function getLabelPoint(points: RelationEdgePoint[]) {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  const middleIndex = Math.floor(points.length / 2);

  if (points.length === 1) {
    return points[0];
  }

  const current = points[middleIndex];
  const previous = points[middleIndex - 1] ?? current;

  return {
    x: (previous.x + current.x) / 2,
    y: (previous.y + current.y) / 2,
  };
}

export function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  data,
}: EdgeProps<RelationEdgeType>) {
  const points =
    data?.points && data.points.length >= 2
      ? data.points
      : [
          { x: sourceX, y: sourceY },
          { x: targetX, y: targetY },
        ];

  const path = getPathFromPoints(points);
  const labelPoint = getLabelPoint(points);

  const opacity = data?.isDimmed ? 0.08 : 1;
  const labelOpacity = data?.isDimmed ? 0.04 : data?.isHighlighted ? 1 : 0.72;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: data?.color ?? "#64748b",
          strokeWidth: data?.isHighlighted ? 3.4 : 2,
          opacity,
          transition: "opacity 160ms ease, stroke-width 160ms ease",
          filter: data?.isHighlighted
            ? "drop-shadow(0 4px 10px rgba(15, 23, 42, 0.22))"
            : "none",
        }}
      />

      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={26}
        className="nodrag nopan cursor-pointer"
        style={{
          pointerEvents: "stroke",
        }}
        onMouseEnter={() => data?.onFocusRelation?.(id)}
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute rounded-lg border bg-background/95 px-2.5 py-1.5 text-[11px] shadow-sm backdrop-blur transition-opacity"
          style={{
            transform: `translate(-50%, -50%) translate(${labelPoint.x}px, ${labelPoint.y}px)`,
            pointerEvents: "all",
            borderColor: data?.color ?? "#cbd5e1",
            color: data?.color ?? "#334155",
            opacity: labelOpacity,
            zIndex: data?.isHighlighted ? 1001 : 20,
          }}
          onMouseEnter={() => data?.onFocusRelation?.(id)}
        >
          <div className="flex items-center gap-1.5 whitespace-nowrap font-semibold">
            <Link2 className="size-3" />
            {data?.relation.sourceField.name} →{" "}
            {data?.relation.targetTable.name}.
            {data?.relation.relation.targetKey}
          </div>

          <div className="mt-0.5 whitespace-nowrap text-[10px] text-muted-foreground">
            displayName:{" "}
            <span style={{ color: data?.color }}>
              {data?.relation.relation.displayField}
            </span>
            {data?.relation.relation.additionalText ? (
              <>
                {" "}
                · add:{" "}
                <span style={{ color: data?.color }}>
                  {data.relation.relation.additionalText}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}