import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import type {
  AdminFieldMeta,
  MetadataExport,
  MetadataExportMenuGroup,
  MetadataExportTable,
} from "@ommr/shared";

import { db } from "../../db/index.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { adminFields, adminTables } from "../../db/schema.js";

export const metadataRouter = Router();

type ExportTableMeta = MetadataExportTable;

type ExportMenuGroup = MetadataExportMenuGroup;

type TableRowForExport = {
  tableId: string;
  tableName: string;
  tableLabel: string;
  tableGroup: string | null;
  tableGroupName: string | null;
  tableShowInMenu: boolean;
  tableSortOrder: number;

  fieldId: string | null;
  fieldName: string | null;
  fieldLabel: string | null;
  fieldInputType: AdminFieldMeta["inputType"] | null;
  fieldVisible: boolean | null;
  fieldRequired: boolean | null;
  fieldEditable: boolean | null;
  fieldRelation: AdminFieldMeta["relation"] | null;
};

function toExportRelation(relation: AdminFieldMeta["relation"]) {
  if (!relation) {
    return null;
  }

  const { targetTableId: _targetTableId, ...exportRelation } = relation;

  return exportRelation;
}

function getMenuGroupId(table: ExportTableMeta) {
  return table.group || "ungrouped";
}

function getMenuGroupLabel(table: ExportTableMeta) {
  return table.groupName || table.group || "Без группы";
}

function buildMenu(tables: ExportTableMeta[]): ExportMenuGroup[] {
  const groupsMap = new Map<string, ExportMenuGroup>();

  for (const table of tables) {
    if (!table.showInMenu) {
      continue;
    }

    const groupId = getMenuGroupId(table);
    const groupLabel = getMenuGroupLabel(table);

    const group = groupsMap.get(groupId);

    if (group) {
      group.elements.push({
        id: table.name,
        label: table.label,
      });

      continue;
    }

    groupsMap.set(groupId, {
      id: groupId,
      label: groupLabel,
      elements: [
        {
          id: table.name,
          label: table.label,
        },
      ],
    });
  }

  return [...groupsMap.values()];
}

function buildMetadataExport(rows: TableRowForExport[]): MetadataExport {
  const tablesMap = new Map<string, ExportTableMeta>();

  for (const row of rows) {
    let table = tablesMap.get(row.tableId);

    if (!table) {
      table = {
        name: row.tableName,
        label: row.tableLabel,
        group: row.tableGroup,
        groupName: row.tableGroupName,
        showInMenu: row.tableShowInMenu,
        fields: [],
      };

      tablesMap.set(row.tableId, table);
    }

    if (row.fieldId) {
      table.fields.push({
        name: row.fieldName ?? "",
        label: row.fieldLabel ?? "",
        inputType: row.fieldInputType!,
        visible: row.fieldVisible ?? true,
        required: row.fieldRequired ?? false,
        editable: row.fieldEditable ?? true,
        relation: toExportRelation(row.fieldRelation),
      });
    }
  }

  const tables = [...tablesMap.values()];
  const menu = buildMenu(tables);

  return {
    tables,
    menu,
  };
}

metadataRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const rows = await db
      .select({
        tableId: adminTables.id,
        tableName: adminTables.name,
        tableLabel: adminTables.label,
        tableGroup: adminTables.group,
        tableGroupName: adminTables.groupName,
        tableShowInMenu: adminTables.showInMenu,
        tableSortOrder: adminTables.sortOrder,

        fieldId: adminFields.id,
        fieldName: adminFields.name,
        fieldLabel: adminFields.label,
        fieldInputType: adminFields.inputType,
        fieldVisible: adminFields.visible,
        fieldRequired: adminFields.required,
        fieldEditable: adminFields.editable,
        fieldRelation: adminFields.relation,
      })
      .from(adminTables)
      .leftJoin(adminFields, eq(adminTables.id, adminFields.tableId))
      .orderBy(
        asc(adminTables.group),
        asc(adminTables.sortOrder),
        asc(adminTables.name),
        asc(adminFields.sortOrder),
        asc(adminFields.name),
      );

    const data = buildMetadataExport(rows);

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