import { Handle, Position, type NodeProps } from "@xyflow/react";
import { KeyRound, Link2, Table2 } from "lucide-react";

import type { RelationGraphRelation, RelationGraphTable } from "@/types/relations.typesА";

export type TableNodeData = {
  table: RelationGraphTable;
  relations: RelationGraphRelation[];
  accentClassName: string;
};

function getSourceHandle(tableName: string, fieldName: string) {
  return `source:${tableName}:${fieldName}`;
}

function getTargetHandle(tableName: string, fieldName: string) {
  return `target:${tableName}:${fieldName}`;
}

function getFieldTypeLabel(inputType: string) {
  return inputType;
}

export function TableNode({ data }: NodeProps) {
  const nodeData = data as TableNodeData;

  const sourceFieldNames = new Set(
    nodeData.relations
      .filter((relation) => relation.sourceTable.name === nodeData.table.name)
      .map((relation) => relation.sourceField.name),
  );

  const targetFieldNames = new Set(
    nodeData.relations
      .filter((relation) => relation.targetTable.name === nodeData.table.name)
      .map((relation) => relation.targetField.name),
  );

  return (
    <div className="w-[320px] overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
      <div className={`border-b px-4 py-3 ${nodeData.accentClassName}`}>
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-background/80 shadow-sm">
            <Table2 className="size-4" />
          </div>

          <div className="min-w-0">
            <div className="truncate text-base font-semibold">
              {nodeData.table.label || nodeData.table.name}
            </div>

            <div className="truncate text-xs text-muted-foreground">
              {nodeData.table.name}
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-[320px] space-y-1 overflow-y-auto overflow-x-hidden p-3">
        {nodeData.table.fields.map((field) => {
          const isSourceField = sourceFieldNames.has(field.name);
          const isTargetField = targetFieldNames.has(field.name);

          return (
            <div
              key={field.id}
              className={
                isSourceField
                  ? "relative grid grid-cols-[24px_minmax(0,1fr)_78px] items-center gap-2 rounded-lg bg-blue-50 px-2 py-2 text-sm"
                  : isTargetField
                    ? "relative grid grid-cols-[24px_minmax(0,1fr)_78px] items-center gap-2 rounded-lg bg-emerald-50 px-2 py-2 text-sm"
                    : "relative grid grid-cols-[24px_minmax(0,1fr)_78px] items-center gap-2 rounded-lg px-2 py-2 text-sm"
              }
            >
              <Handle
                id={getTargetHandle(nodeData.table.name, field.name)}
                type="target"
                position={Position.Left}
                className={
                  isTargetField
                    ? "!left-[-7px] !size-3 !border-2 !border-background !bg-emerald-500"
                    : "!left-[-7px] !size-2 !border-2 !border-background !bg-muted"
                }
              />

              <div className="grid place-items-center">
                {field.name === "id" || isTargetField ? (
                  <KeyRound className="size-4 text-amber-500" />
                ) : isSourceField ? (
                  <Link2 className="size-4 text-blue-600" />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                )}
              </div>

              <div className="truncate font-medium">{field.name}</div>

              <div className="truncate text-right text-xs text-muted-foreground">
                {getFieldTypeLabel(field.inputType)}
              </div>

              <Handle
                id={getSourceHandle(nodeData.table.name, field.name)}
                type="source"
                position={Position.Right}
                className={
                  isSourceField
                    ? "!right-[-7px] !size-3 !border-2 !border-background !bg-blue-500"
                    : "!right-[-7px] !size-2 !border-2 !border-background !bg-muted"
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}