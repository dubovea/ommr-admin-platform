import { Router } from "express";
import { eq } from "drizzle-orm";
import type { FieldRelationMeta } from "@ommr/shared";

import { db } from "../../db/index.js";
import { adminFields, adminTables } from "../../db/schema.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { getRequiredStringForEq } from "../../lib/utils.js";
import { parsePydanticJsonSchema } from "../../services/pydantic-schema-parser.service.js";

export const schemasRouter = Router();

function mapImportedRelation(
  relation: FieldRelationMeta | null | undefined,
  importedTableIdsByName: Map<string, string>,
): {
  relation: FieldRelationMeta | null;
  relationTargetTableId: string | null;
} {
  if (!relation?.targetTable) {
    return {
      relation: null,
      relationTargetTableId: null,
    };
  }

  const targetTableId = importedTableIdsByName.get(relation.targetTable);

  if (!targetTableId) {
    return {
      relation: null,
      relationTargetTableId: null,
    };
  }

  return {
    relation: {
      ...relation,
      targetTableId,
    },
    relationTargetTableId: targetTableId,
  };
}

schemasRouter.post(
  "/parse-pydantic",
  asyncHandler(async (req, res) => {
    const method = "POST /schemas/parse-pydantic";

    const tables = parsePydanticJsonSchema(req.body.schema);

    const tableIds: string[] = [];
    const importedTableIdsByName = new Map<string, string>();
    const savedTablesByName = new Map<
      string,
      typeof adminTables.$inferSelect
    >();

    let importedFields = 0;
    let mappedRelations = 0;
    let skippedRelations = 0;

    for (const table of tables) {
      const tableName = getRequiredStringForEq({
        value: table.name,
        field: "table.name",
        method,
        res,
      });

      if (!tableName) {
        return;
      }

      const [existing] = await db
        .select()
        .from(adminTables)
        .where(eq(adminTables.name, tableName));

      let savedTable: typeof adminTables.$inferSelect;

      if (existing) {
        const existingId = getRequiredStringForEq({
          value: existing.id,
          field: "existing.id",
          method,
          res,
        });

        if (!existingId) {
          return;
        }

        [savedTable] = await db
          .update(adminTables)
          .set({
            label: table.label,
            description: table.description,
            source: "pydantic",
            status: "needs_setup",
            updatedAt: new Date(),
          })
          .where(eq(adminTables.id, existingId))
          .returning();
      } else {
        [savedTable] = await db
          .insert(adminTables)
          .values({
            name: table.name,
            label: table.label,
            description: table.description,
            source: "pydantic",
            status: "needs_setup",
            icon: "table",
          })
          .returning();
      }
      if (!savedTable) {
        res.status(500).json({
          error: "Table import failed",
          method,
          field: "savedTable",
          value: table.name,
          reason: "Table was not returned after insert/update",
        });
        return;
      }

      const savedTableId = getRequiredStringForEq({
        value: savedTable.id,
        field: "savedTable.id",
        method,
        res,
      });

      if (!savedTableId) {
        return;
      }

      savedTablesByName.set(tableName, savedTable);
      importedTableIdsByName.set(tableName, savedTableId);
      tableIds.push(savedTableId);
    }

    for (const table of tables) {
      const tableName = getRequiredStringForEq({
        value: table.name,
        field: "table.name",
        method,
        res,
      });

      if (!tableName) {
        return;
      }

      const savedTable = savedTablesByName.get(tableName);

      if (!savedTable) {
        skippedRelations += table.fields.filter(
          (field) => field.relation,
        ).length;
        continue;
      }

      const savedTableId = getRequiredStringForEq({
        value: savedTable.id,
        field: "savedTable.id",
        method,
        res,
      });

      if (!savedTableId) {
        return;
      }

      await db.delete(adminFields).where(eq(adminFields.tableId, savedTableId));

      if (table.fields.length === 0) {
        continue;
      }

      await db.insert(adminFields).values(
        table.fields.map((field, index) => {
          /**
           * Связи из Pydantic-маппинга проставляем после создания/обновления
           * всех таблиц из JSON.
           *
           * Почему так:
           * поле может ссылаться на таблицу, которая находится ниже в этом же
           * JSON-файле. Поэтому сначала сохраняем все admin_tables, собираем
           * map `table.name -> table.id`, и только потом мэппим relation.
           *
           * Если `relation.targetTable` не найден среди успешно вставленных
           * таблиц, связь считается неподтверждённой: очищаем `relation` и
           * `relationTargetTableId`, чтобы в UI не висела битая связь.
           */
          const mappedRelation = mapImportedRelation(
            field.relation ?? null,
            importedTableIdsByName,
          );

          if (field.relation && mappedRelation.relation) {
            mappedRelations += 1;
          }

          if (field.relation && !mappedRelation.relation) {
            skippedRelations += 1;
          }

          return {
            tableId: savedTableId,
            name: field.name,
            label: field.label,
            dbType: field.dbType,
            inputType: field.inputType,
            required: field.required,
            editable: field.editable,
            sortable: field.sortable,
            filterable: field.filterable,
            visible: field.visible,
            group: field.group ?? null,
            defaultValue: field.defaultValue ?? null,
            options: field.options ?? null,
            validation: field.validation ?? null,
            placeholder: field.placeholder ?? null,
            helpText: field.helpText ?? null,
            relation: mappedRelation.relation,
            relationTargetTableId: mappedRelation.relationTargetTableId,
            sortOrder: field.sortOrder ?? index + 1,
          };
        }),
      );

      importedFields += table.fields.length;
    }

    res.json({
      data: {
        importedTables: tables.length,
        importedFields,
        mappedRelations,
        skippedRelations,
        tableIds,
      },
    });
  }),
);
