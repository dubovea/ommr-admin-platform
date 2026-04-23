import { Router } from "express";
import { asc, eq, inArray } from "drizzle-orm";

import { db } from "../../db/index.js";
import { adminFields, adminTables } from "../../db/schema.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { createFieldSchema, updateFieldSchema } from "../../validation.js";
import { normalizeFieldUpdatePayload, parseIdsQuery } from "../../lib/utils.js";

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
            .orderBy(
              asc(adminFields.group),
              asc(adminFields.sortOrder),
              asc(adminFields.name),
            )
        : await db
            .select()
            .from(adminFields)
            .orderBy(
              asc(adminFields.group),
              asc(adminFields.sortOrder),
              asc(adminFields.name),
            );

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

    const [created] = await db.transaction(async (tx) => {
      const [newField] = await tx
        .insert(adminFields)
        .values(payload)
        .returning();

      await tx
        .update(adminTables)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(adminTables.id, payload.tableId));

      return [newField];
    });

    res.status(201).json({
      data: created,
    });
  }),
);

fieldsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const payload = updateFieldSchema.parse(req.body);
    const normalizedPayload = normalizeFieldUpdatePayload(payload);

    const [updated] = await db.transaction(async (tx) => {
      const [field] = await tx
        .select({
          id: adminFields.id,
          tableId: adminFields.tableId,
        })
        .from(adminFields)
        .where(eq(adminFields.id, req.params.id));

      if (!field) {
        return [null];
      }

      const [updatedField] = await tx
        .update(adminFields)
        .set({
          ...normalizedPayload,
          updatedAt: new Date(),
        })
        .where(eq(adminFields.id, req.params.id))
        .returning();

      await tx
        .update(adminTables)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(adminTables.id, field.tableId));

      return [updatedField];
    });

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

    const result = await db.transaction(async (tx) => {
      const affectedFields = await tx
        .select({
          id: adminFields.id,
          tableId: adminFields.tableId,
        })
        .from(adminFields)
        .where(inArray(adminFields.id, ids));

      if (affectedFields.length === 0) {
        return {
          deleted: [],
        };
      }

      const tableIds = [
        ...new Set(affectedFields.map((field) => field.tableId)),
      ];

      const deleted = await tx
        .delete(adminFields)
        .where(inArray(adminFields.id, ids))
        .returning();

      await tx
        .update(adminTables)
        .set({
          updatedAt: new Date(),
        })
        .where(inArray(adminTables.id, tableIds));

      return { deleted };
    });

    res.json({
      data: result.deleted,
      total: result.deleted.length,
    });
  }),
);

fieldsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await db.transaction(async (tx) => {
      const [field] = await tx
        .select({
          id: adminFields.id,
          tableId: adminFields.tableId,
        })
        .from(adminFields)
        .where(eq(adminFields.id, req.params.id));

      if (!field) {
        return {
          deleted: null,
        };
      }

      const [deleted] = await tx
        .delete(adminFields)
        .where(eq(adminFields.id, req.params.id))
        .returning();

      await tx
        .update(adminTables)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(adminTables.id, field.tableId));

      return { deleted };
    });

    if (!result.deleted) {
      res.status(404).json({
        error: "Field not found",
      });
      return;
    }

    res.json({
      data: result.deleted,
    });
  }),
);
