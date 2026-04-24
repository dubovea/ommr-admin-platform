import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { Link2 } from "lucide-react";

import type { RelationGraphRelation } from "@/types/relations.types";

export type RelationEdgeData = {
  relation: RelationGraphRelation;
  color: string;
  textColorClassName: string;
  bgClassName: string;
};

export function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps) {
  const edgeData = data as RelationEdgeData;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 24,
  });

  const additionalText = edgeData.relation.relation.additionalText;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: edgeData.color,
          strokeWidth: 2.5,
          filter: "drop-shadow(0 3px 8px rgba(15, 23, 42, 0.14))",
        }}
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          <div
            className={`rounded-xl border bg-background/95 px-3 py-2 text-[11px] shadow-md backdrop-blur ${edgeData.bgClassName}`}
          >
            <div
              className={`flex items-center gap-1.5 whitespace-nowrap font-semibold ${edgeData.textColorClassName}`}
            >
              <Link2 className="size-3" />
              {edgeData.relation.sourceField.name} →{" "}
              {edgeData.relation.targetTable.name}.
              {edgeData.relation.relation.targetKey}
            </div>

            <div className="mt-0.5 whitespace-nowrap text-muted-foreground">
              display:{" "}
              <span className={`font-semibold ${edgeData.textColorClassName}`}>
                {edgeData.relation.relation.displayField}
              </span>
              {additionalText ? (
                <>
                  {" "}
                  · add:{" "}
                  <span
                    className={`font-semibold ${edgeData.textColorClassName}`}
                  >
                    {additionalText}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
