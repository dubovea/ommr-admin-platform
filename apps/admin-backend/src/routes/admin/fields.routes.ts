import { Router } from "express";
import { asc, eq, inArray } from "drizzle-orm";

import { db } from "../../db/index.js";
import { adminFields, adminTables } from "../../db/schema.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { createFieldSchema, updateFieldSchema } from "../../validation.js";
import {
  getRequiredStringForEq,
  normalizeFieldCreatePayload,
  normalizeFieldUpdatePayload,
  parseIdsQuery,
} from "../../lib/utils.js";

export const fieldsRouter = Router();

fieldsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const method = "GET /fields";
    const tableIdQuery = req.query.tableId;

    if (tableIdQuery !== undefined) {
      const tableId = getRequiredStringForEq({
        value: tableIdQuery,
        field: "tableId",
        method,
        res,
      });

      if (!tableId) {
        return;
      }

      const fields = await db
        .select()
        .from(adminFields)
        .where(eq(adminFields.tableId, tableId))
        .orderBy(
          asc(adminFields.group),
          asc(adminFields.sortOrder),
          asc(adminFields.name),
        );

      res.json({
        data: fields,
        total: fields.length,
      });

      return;
    }

    const fields = await db
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
    const method = "POST /fields";

    const payload = createFieldSchema.parse(req.body);
    const normalizedPayload = normalizeFieldCreatePayload(payload);

    const tableId = getRequiredStringForEq({
      value: payload.tableId,
      field: "tableId",
      method,
      res,
    });

    if (!tableId) {
      return;
    }

    const [created] = await db.transaction(async (tx) => {
      const [newField] = await tx
        .insert(adminFields)
        .values(normalizedPayload)
        .returning();

      await tx
        .update(adminTables)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(adminTables.id, tableId));

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
    const method = "PATCH /fields/:id";

    const id = getRequiredStringForEq({
      value: req.params.id,
      field: "id",
      method,
      res,
    });

    if (!id) {
      return;
    }

    const payload = updateFieldSchema.parse(req.body);
    const normalizedPayload = normalizeFieldUpdatePayload(payload);

    const [updated] = await db.transaction(async (tx) => {
      const [field] = await tx
        .select({
          id: adminFields.id,
          tableId: adminFields.tableId,
        })
        .from(adminFields)
        .where(eq(adminFields.id, id));

      if (!field) {
        return [null];
      }

      const tableId = getRequiredStringForEq({
        value: field.tableId,
        field: "tableId",
        method,
        res,
      });

      if (!tableId) {
        return [null];
      }

      const [updatedField] = await tx
        .update(adminFields)
        .set({
          ...normalizedPayload,
          updatedAt: new Date(),
        })
        .where(eq(adminFields.id, id))
        .returning();

      await tx
        .update(adminTables)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(adminTables.id, tableId));

      return [updatedField];
    });

    if (!updated) {
      res.status(404).json({
        error: "Field not found",
        method,
        field: "id",
        value: id,
        reason: "No field found with provided id",
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
    const method = "DELETE /fields";

    const ids = parseIdsQuery(req.query.ids);

    if (ids.length === 0) {
      res.status(400).json({
        error: "Invalid field value",
        method,
        field: "ids",
        value: req.query.ids,
        reason: "Передайте ids через query: ?ids=id1&ids=id2",
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
    const method = "DELETE /fields/:id";

    const id = getRequiredStringForEq({
      value: req.params.id,
      field: "id",
      method,
      res,
    });

    if (!id) {
      return;
    }

    const result = await db.transaction(async (tx) => {
      const [field] = await tx
        .select({
          id: adminFields.id,
          tableId: adminFields.tableId,
        })
        .from(adminFields)
        .where(eq(adminFields.id, id));

      if (!field) {
        return {
          deleted: null,
        };
      }

      const tableId = getRequiredStringForEq({
        value: field.tableId,
        field: "tableId",
        method,
        res,
      });

      if (!tableId) {
        return {
          deleted: null,
        };
      }

      const [deleted] = await tx
        .delete(adminFields)
        .where(eq(adminFields.id, id))
        .returning();

      await tx
        .update(adminTables)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(adminTables.id, tableId));

      return { deleted };
    });

    if (!result.deleted) {
      res.status(404).json({
        error: "Field not found",
        method,
        field: "id",
        value: id,
        reason: "No field found with provided id",
      });
      return;
    }

    res.json({
      data: result.deleted,
    });
  }),
);