import { Router } from "express";
import { asc, eq, inArray } from "drizzle-orm";

import { db } from "../../db/index.js";
import { adminFields } from "../../db/schema.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { createFieldSchema, updateFieldSchema } from "../../validation.js";
import { parseIdsQuery } from "../../lib/utils.js";

export const fieldsRouter = Router();

fieldsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const tableId = req.query.tableId;

    const fields =
      typeof tableId === "string"
        ? await db
            .select()
            .from(adminFields)
            .where(eq(adminFields.tableId, tableId))
            .orderBy(asc(adminFields.sortOrder), asc(adminFields.name))
        : await db
            .select()
            .from(adminFields)
            .orderBy(asc(adminFields.sortOrder), asc(adminFields.name));

    res.json({
      data: fields,
      total: fields.length,
    });
  }),
);

fieldsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = createFieldSchema.parse(req.body);

    const [created] = await db.insert(adminFields).values(payload).returning();

    res.status(201).json({
      data: created,
    });
  }),
);

fieldsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const payload = updateFieldSchema.parse(req.body);

    const [updated] = await db
      .update(adminFields)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(adminFields.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({
        error: "Field not found",
      });
      return;
    }

    res.json({
      data: updated,
    });
  }),
);

fieldsRouter.delete(
  "/",
  asyncHandler(async (req, res) => {
    const ids = parseIdsQuery(req.query.ids);
    if (ids.length === 0) {
      res.status(400).json({
        error: "Передайте ids через query: ?ids=id1&ids=id2",
      });
      return;
    }

    const deleted = await db
      .delete(adminFields)
      .where(inArray(adminFields.id, ids))
      .returning();

    res.json({
      data: deleted,
      total: deleted.length,
    });
  }),
);

fieldsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const [deleted] = await db
      .delete(adminFields)
      .where(eq(adminFields.id, req.params.id))
      .returning();

    if (!deleted) {
      res.status(404).json({
        error: "Field not found",
      });
      return;
    }

    res.json({
      data: deleted,
    });
  }),
);
