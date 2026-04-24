import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import type { AdminFieldMeta, AdminTableMeta } from "@ommr/shared";

import { db } from "../../db/index.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { adminFields, adminTables } from "../../db/schema.js";

export const metadataRouter = Router();

type ExportFieldMeta = Pick<
  AdminFieldMeta,
  "name" | "label" | "inputType" | "relation"
>;

type ExportTableMeta = Pick<AdminTableMeta, "name" | "label"> & {
  fields: ExportFieldMeta[];
};

metadataRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const rows = await db
      .select({
        tableId: adminTables.id,
        tableName: adminTables.name,
        tableLabel: adminTables.label,

        fieldId: adminFields.id,
        fieldName: adminFields.name,
        fieldLabel: adminFields.label,
        fieldInputType: adminFields.inputType,
        fieldRelation: adminFields.relation,
      })
      .from(adminTables)
      .leftJoin(adminFields, eq(adminTables.id, adminFields.tableId))
      .orderBy(
        asc(adminTables.name),
        asc(adminFields.sortOrder),
        asc(adminFields.name),
      );

    const tablesMap = new Map<string, ExportTableMeta>();

    for (const row of rows) {
      let table = tablesMap.get(row.tableId);

      if (!table) {
        table = {
          name: row.tableName,
          label: row.tableLabel,
          fields: [],
        };

        tablesMap.set(row.tableId, table);
      }

      if (row.fieldId) {
        table.fields.push({
          name: row.fieldName ?? "",
          label: row.fieldLabel ?? "",
          inputType: row.fieldInputType!,
          relation: row.fieldRelation ?? null,
        });
      }
    }

    const data = [...tablesMap.values()];

    const shouldDownload = req.query.download === "true";

    if (shouldDownload) {
      const filename = `metadata_${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-")}.json`;

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );

      res.send(JSON.stringify(data, null, 2));
      return;
    }

    res.json({
      data,
    });
  }),
);