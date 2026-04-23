
import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { adminFields, adminTables } from "../../db/schema.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { parsePydanticJsonSchema } from "../../services/pydantic-schema-parser.service.js";

export const schemasRouter = Router();

schemasRouter.post(
  "/parse-pydantic",
  asyncHandler(async (req, res) => {
    const tables = parsePydanticJsonSchema(req.body.schema);
    const tableIds: string[] = [];
    let importedFields = 0;

    for (const table of tables) {
      const [existing] = await db
        .select()
        .from(adminTables)
        .where(eq(adminTables.name, table.name));

      const [savedTable] = existing
        ? await db
            .update(adminTables)
            .set({
              dbName: table.dbName,
              label: table.label,
              description: table.description,
              source: "pydantic",
              status: "needs_setup",
              updatedAt: new Date(),
            })
            .where(eq(adminTables.id, existing.id))
            .returning()
        : await db
            .insert(adminTables)
            .values({
              name: table.name,
              dbName: table.dbName,
              label: table.label,
              description: table.description,
              source: "pydantic",
              status: "needs_setup",
              icon: "table",
            })
            .returning();

      await db.delete(adminFields).where(eq(adminFields.tableId, savedTable.id));

      if (table.fields.length > 0) {
        await db.insert(adminFields).values(
          table.fields.map((field, index) => ({
            tableId: savedTable.id,
            name: field.name,
            label: field.label,
            dbType: field.dbType,
            inputType: field.inputType,
            required: field.required,
            editable: field.editable,
            sortable: field.sortable,
            filterable: field.filterable,
            visible: field.visible,
            group: field.group,
            defaultValue: field.defaultValue,
            options: field.options,
            validation: field.validation,
            placeholder: null,
            helpText: null,
            relation: field.relation,
            sortOrder: index + 1,
          })),
        );
      }

      tableIds.push(savedTable.id);
      importedFields += table.fields.length;
    }

    res.json({
      data: { importedTables: tables.length, importedFields, tableIds },
    });
  }),
);
