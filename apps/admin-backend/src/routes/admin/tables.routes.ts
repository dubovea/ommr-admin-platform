import { Router } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { adminFields, adminTables } from "../../db/schema.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { createTableSchema, updateTableSchema } from "../../validation.js";

export const tablesRouter = Router();

tablesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const tables = await db
      .select({
        id: adminTables.id,
        name: adminTables.name,
        dbName: adminTables.dbName,
        label: adminTables.label,
        description: adminTables.description,
        icon: adminTables.icon,
        status: adminTables.status,
        source: adminTables.source,
        canList: adminTables.canList,
        canCreate: adminTables.canCreate,
        canEdit: adminTables.canEdit,
        canDelete: adminTables.canDelete,
        createdAt: adminTables.createdAt,
        updatedAt: adminTables.updatedAt,
        fieldsCount: sql<number>`cast(count(${adminFields.id}) as int)`,
        requiredFieldsCount: sql<number>`cast(sum(case when ${adminFields.required} then 1 else 0 end) as int)`,
        relationsCount: sql<number>`cast(sum(case when ${adminFields.relation} is not null then 1 else 0 end) as int)`,
      })
      .from(adminTables)
      .leftJoin(adminFields, eq(adminTables.id, adminFields.tableId))
      .groupBy(adminTables.id)
      .orderBy(asc(adminTables.sortOrder), asc(adminTables.name));

    res.json({
      data: tables,
      total: tables.length,
    });
  }),
);

tablesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [table] = await db
      .select()
      .from(adminTables)
      .where(eq(adminTables.id, req.params.id));

    if (!table) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    const fields = await db
      .select()
      .from(adminFields)
      .where(eq(adminFields.tableId, req.params.id))
      .orderBy(asc(adminFields.sortOrder), asc(adminFields.name));

    res.json({
      data: {
        ...table,
        fields,
        fieldsCount: fields.length,
        requiredFieldsCount: fields.filter((field) => field.required).length,
        relationsCount: fields.filter((field) => field.relation).length,
      },
    });
  }),
);

tablesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = createTableSchema.parse(req.body);

    const [created] = await db.insert(adminTables).values(payload).returning();

    res.status(201).json({ data: created });
  }),
);

tablesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const payload = updateTableSchema.parse(req.body);

    const [updated] = await db
      .update(adminTables)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(adminTables.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    res.json({ data: updated });
  }),
);
