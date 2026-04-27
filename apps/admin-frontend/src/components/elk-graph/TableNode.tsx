import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Database, KeyRound, Link2 } from "lucide-react";

import {
  FIELD_ROW_HEIGHT,
  getGraphFields,
  getHiddenFieldsCount,
  getSourceHandle,
  getTableSourceFields,
  getTableTargetFields,
  getTargetHandle,
} from "@/lib/relation-graph-model";
import type {
  RelationGraphRelation,
  RelationGraphTable,
} from "@/types/relations.types";

export type TableNodeData = {
  table: RelationGraphTable;
  relations: RelationGraphRelation[];
  isDimmed: boolean;
  isHighlighted: boolean;
  onFocusTable?: (tableName: string) => void;
};

export type TableNodeType = Node<TableNodeData, "tableNode">;

export function TableNode({ data }: NodeProps<TableNodeType>) {
  const graphFields = getGraphFields(data.table, data.relations);
  const hiddenCount = getHiddenFieldsCount(data.table, data.relations);

  const sourceFieldNames = getTableSourceFields(
    data.table.name,
    data.relations,
  );

  const targetFieldNames = getTableTargetFields(
    data.table.name,
    data.relations,
  );

  return (
    <div
      className={[
        "nodrag nopan w-[340px] overflow-hidden rounded-xl border bg-background shadow-sm transition-all duration-150",
        data.isHighlighted ? "ring-2 ring-blue-400/70" : "",
        data.isDimmed ? "opacity-15" : "opacity-100",
      ].join(" ")}
      onMouseEnter={() => data.onFocusTable?.(data.table.name)}
    >
      <div className="flex h-[58px] items-center gap-3 border-b bg-muted/40 px-4">
        <div className="grid size-8 place-items-center rounded-lg bg-background shadow-sm">
          <Database className="size-4 text-muted-foreground" />
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {data.table.label || data.table.name}
          </div>

          <div className="truncate text-xs text-muted-foreground">
            {data.table.name}
          </div>
        </div>
      </div>

      <div className="space-y-1 px-3 py-3">
        {graphFields.map((field) => {
          const isSourceField = sourceFieldNames.has(field.name);
          const isTargetField = targetFieldNames.has(field.name);

          return (
            <div
              key={field.id}
              className={[
                "relative grid items-center gap-2 rounded-lg px-2 text-sm",
                "grid-cols-[22px_minmax(0,1fr)_82px]",
                isSourceField ? "bg-blue-50" : "",
                isTargetField ? "bg-emerald-50" : "",
              ].join(" ")}
              style={{
                height: FIELD_ROW_HEIGHT,
              }}
            >
              <Handle
                id={getTargetHandle(data.table.name, field.name)}
                type="target"
                position={Position.Left}
                className={[
                  "!left-[-8px] !border-2 !border-background",
                  isTargetField
                    ? "!size-3 !bg-emerald-500"
                    : "!size-2 !bg-muted-foreground/25",
                ].join(" ")}
              />

              <div className="grid place-items-center">
                {field.name === "id" ||
                field.name === "code" ||
                isTargetField ? (
                  <KeyRound className="size-4 text-amber-500" />
                ) : isSourceField ? (
                  <Link2 className="size-4 text-blue-600" />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                )}
              </div>

              <div className="truncate font-medium">{field.name}</div>

              <div className="truncate text-right text-xs text-muted-foreground">
                {field.inputType}
              </div>

              <Handle
                id={getSourceHandle(data.table.name, field.name)}
                type="source"
                position={Position.Right}
                className={[
                  "!right-[-8px] !border-2 !border-background",
                  isSourceField
                    ? "!size-3 !bg-blue-500"
                    : "!size-2 !bg-muted-foreground/25",
                ].join(" ")}
              />
            </div>
          );
        })}

        {hiddenCount > 0 ? (
          <div className="px-2 pt-1 text-xs text-muted-foreground">
            + ещё {hiddenCount} полей скрыто
          </div>
        ) : null}
      </div>
    </div>
  );
}