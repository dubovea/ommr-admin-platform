import { Router } from "express";
import { asc, eq, isNotNull } from "drizzle-orm";
import type { AdminFieldMeta } from "@ommr/shared";

import { db } from "../../db/index.js";
import { adminFields, adminTables } from "../../db/schema.js";
import { asyncHandler } from "../../lib/async-handler.js";

export const relationsRouter = Router();

type RelationMeta = NonNullable<AdminFieldMeta["relation"]>;

export type RelationGraphTableField = {
  id: string;
  name: string;
  label: string;
  inputType: AdminFieldMeta["inputType"];
};

export type RelationGraphTable = {
  id: string;
  name: string;
  label: string;
  fields: RelationGraphTableField[];
};

export type RelationGraphRelation = {
  id: string;

  sourceTable: {
    id: string;
    name: string;
    label: string;
  };

  sourceField: {
    id: string;
    name: string;
    label: string;
    inputType: AdminFieldMeta["inputType"];
  };

  targetTable: {
    id: string;
    name: string;
    label: string;
  };

  targetField: {
    name: string;
  };

  relation: {
    targetKey: string;
    displayField: string;
    additionalText: string | null;
  };

  sourceHandle: string;
  targetHandle: string;
};

export type RelationGraphResponse = {
  tables: RelationGraphTable[];
  relations: RelationGraphRelation[];
};

function getSourceHandle(tableName: string, fieldName: string) {
  return `source:${tableName}:${fieldName}`;
}

function getTargetHandle(tableName: string, fieldName: string) {
  return `target:${tableName}:${fieldName}`;
}

relationsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const tableRows = await db
      .select({
        tableId: adminTables.id,
        tableName: adminTables.name,
        tableLabel: adminTables.label,

        fieldId: adminFields.id,
        fieldName: adminFields.name,
        fieldLabel: adminFields.label,
        fieldInputType: adminFields.inputType,
      })
      .from(adminTables)
      .leftJoin(adminFields, eq(adminTables.id, adminFields.tableId))
      .orderBy(
        asc(adminTables.name),
        asc(adminFields.sortOrder),
        asc(adminFields.name),
      );

    const tablesMap = new Map<string, RelationGraphTable>();

    for (const row of tableRows) {
      let table = tablesMap.get(row.tableId);

      if (!table) {
        table = {
          id: row.tableId,
          name: row.tableName,
          label: row.tableLabel,
          fields: [],
        };

        tablesMap.set(row.tableId, table);
      }

      if (row.fieldId) {
        table.fields.push({
          id: row.fieldId,
          name: row.fieldName ?? "",
          label: row.fieldLabel ?? "",
          inputType: row.fieldInputType!,
        });
      }
    }

    const relationRows = await db
      .select({
        fieldId: adminFields.id,
        fieldName: adminFields.name,
        fieldLabel: adminFields.label,
        fieldInputType: adminFields.inputType,
        fieldRelation: adminFields.relation,

        sourceTableId: adminTables.id,
        sourceTableName: adminTables.name,
        sourceTableLabel: adminTables.label,
      })
      .from(adminFields)
      .innerJoin(adminTables, eq(adminFields.tableId, adminTables.id))
      .where(isNotNull(adminFields.relationTargetTableId))
      .orderBy(
        asc(adminTables.name),
        asc(adminFields.sortOrder),
        asc(adminFields.name),
      );

    const relations: RelationGraphRelation[] = relationRows
      .filter((row): row is typeof row & { fieldRelation: RelationMeta } =>
        Boolean(row.fieldRelation),
      )
      .map((row) => {
        const targetTable = tablesMap.get(row.fieldRelation.targetTableId);

        return {
          id: row.fieldId,

          sourceTable: {
            id: row.sourceTableId,
            name: row.sourceTableName,
            label: row.sourceTableLabel,
          },

          sourceField: {
            id: row.fieldId,
            name: row.fieldName,
            label: row.fieldLabel,
            inputType: row.fieldInputType,
          },

          targetTable: {
            id: row.fieldRelation.targetTableId,
            name: row.fieldRelation.targetTable,
            label: targetTable?.label ?? row.fieldRelation.targetTable,
          },

          targetField: {
            name: row.fieldRelation.targetKey,
          },

          relation: {
            targetKey: row.fieldRelation.targetKey,
            displayField: row.fieldRelation.displayField,
            additionalText: row.fieldRelation.additionalText ?? null,
          },

          sourceHandle: getSourceHandle(row.sourceTableName, row.fieldName),
          targetHandle: getTargetHandle(
            row.fieldRelation.targetTable,
            row.fieldRelation.targetKey,
          ),
        };
      });

    res.json({
      data: {
        tables: [...tablesMap.values()],
        relations,
      } satisfies RelationGraphResponse,
    });
  }),
);