import { Router } from "express";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { adminFields, adminTables } from "../../db/schema.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { createTableSchema, updateTableSchema } from "../../validation.js";
import { getRequiredStringForEq, parseIdsQuery } from "../../lib/utils.js";
import {
  buildMultiColumnFilterCondition,
  buildWhereFromCrudFilters,
  parseFiltersQuery,
  parsePositiveInt,
  type FilterColumnMap,
} from "../../lib/admin-filter.utils.js";

export const tablesRouter = Router();

const tableFilterColumns: FilterColumnMap = {
  id: adminTables.id,
  name: adminTables.name,
  label: adminTables.label,
  description: adminTables.description,
  icon: adminTables.icon,
  status: adminTables.status,
  source: adminTables.source,
  group: adminTables.group,
  groupName: adminTables.groupName,
  showInMenu: adminTables.showInMenu,
  canList: adminTables.canList,
  canCreate: adminTables.canCreate,
  canEdit: adminTables.canEdit,
  canDelete: adminTables.canDelete,
  sortOrder: adminTables.sortOrder,
  createdAt: adminTables.createdAt,
  updatedAt: adminTables.updatedAt,
};

function buildTablesWhere(filters: ReturnType<typeof parseFiltersQuery>) {
  return buildWhereFromCrudFilters(filters, tableFilterColumns, {
    fieldHandlers: {
      name: (operator, value) =>
        buildMultiColumnFilterCondition(
          [adminTables.name, adminTables.label],
          operator,
          value,
        ),
    },
  });
}

tablesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const includeFields = req.query.includeFields === "true";

    const filters = parseFiltersQuery(req.query.filters);
    const where = buildTablesWhere(filters);

    const shouldPaginate =
      req.query.page !== undefined ||
      req.query.pageSize !== undefined ||
      req.query.limit !== undefined;

    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(
      req.query.pageSize ?? req.query.limit,
      10,
    );

    const offset = (page - 1) * pageSize;

    let totalQuery = db
      .select({
        total: sql<number>`cast(count(${adminTables.id}) as int)`,
      })
      .from(adminTables)
      .$dynamic();

    if (where) {
      totalQuery = totalQuery.where(where);
    }

    const [totalRow] = await totalQuery;
    const total = totalRow?.total ?? 0;

    let tablesQuery = db
      .select({
        id: adminTables.id,
        name: adminTables.name,
        group: adminTables.group,
        groupName: adminTables.groupName,
        showInMenu: adminTables.showInMenu,
        label: adminTables.label,
        description: adminTables.description,
        icon: adminTables.icon,
        status: adminTables.status,
        source: adminTables.source,
        canList: adminTables.canList,
        canCreate: adminTables.canCreate,
        canEdit: adminTables.canEdit,
        canDelete: adminTables.canDelete,
        sortOrder: adminTables.sortOrder,
        createdAt: adminTables.createdAt,
        updatedAt: adminTables.updatedAt,
        fieldsCount: sql<number>`cast(count(${adminFields.id}) as int)`,
        requiredFieldsCount: sql<number>`coalesce(cast(sum(case when ${adminFields.required} then 1 else 0 end) as int), 0)`,
        relationsCount: sql<number>`coalesce(cast(sum(case when ${adminFields.relationTargetTableId} is not null then 1 else 0 end) as int), 0)`,
      })
      .from(adminTables)
      .leftJoin(adminFields, eq(adminTables.id, adminFields.tableId))
      .$dynamic();

    if (where) {
      tablesQuery = tablesQuery.where(where);
    }

    tablesQuery = tablesQuery
      .groupBy(adminTables.id)
      .orderBy(desc(adminTables.updatedAt));

    if (shouldPaginate) {
      tablesQuery = tablesQuery.limit(pageSize).offset(offset);
    }

    const tables = await tablesQuery;

    if (!includeFields) {
      res.json({
        data: tables,
        total,
      });
      return;
    }

    const tableIds = tables.map((table) => table.id);

    if (tableIds.length === 0) {
      res.json({
        data: [],
        total,
      });
      return;
    }

    const fields = await db
      .select()
      .from(adminFields)
      .where(inArray(adminFields.tableId, tableIds))
      .orderBy(
        asc(adminFields.tableId),
        asc(adminFields.group),
        asc(adminFields.sortOrder),
        asc(adminFields.name),
      );

    const fieldsByTableId = new Map<string, typeof fields>();

    for (const field of fields) {
      const currentFields = fieldsByTableId.get(field.tableId) ?? [];
      currentFields.push(field);
      fieldsByTableId.set(field.tableId, currentFields);
    }

    const tablesWithFields = tables.map((table) => ({
      ...table,
      fields: fieldsByTableId.get(table.id) ?? [],
    }));

    res.json({
      data: tablesWithFields,
      total,
    });
  }),
);

tablesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const method = "GET /tables/:id";

    const id = getRequiredStringForEq({
      value: req.params.id,
      field: "id",
      method,
      res,
    });

    if (!id) {
      return;
    }

    const [table] = await db
      .select()
      .from(adminTables)
      .where(eq(adminTables.id, id));

    if (!table) {
      res.status(404).json({
        error: "Table not found",
        method,
        field: "id",
        value: id,
        reason: "No table found with provided id",
      });
      return;
    }

    const fields = await db
      .select()
      .from(adminFields)
      .where(eq(adminFields.tableId, id))
      .orderBy(
        asc(adminFields.group),
        asc(adminFields.sortOrder),
        asc(adminFields.name),
      );

    res.json({
      data: {
        ...table,
        fields,
        fieldsCount: fields.length,
        requiredFieldsCount: fields.filter((field) => field.required).length,
        relationsCount: fields.filter(
          (field) => field.relationTargetTableId !== null,
        ).length,
      },
    });
  }),
);

tablesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const method = "POST /tables";

    const payload = createTableSchema.parse(req.body);

    const name = getRequiredStringForEq({
      value: payload.name,
      field: "name",
      method,
      res,
    });

    if (!name) {
      return;
    }

    const [table] = await db
      .select()
      .from(adminTables)
      .where(eq(adminTables.name, name));

    if (table) {
      res.status(409).json({
        error: "Table already exists",
        method,
        field: "name",
        value: name,
        reason: `Таблица с именем ${table.name} уже существует.`,
      });
      return;
    }

    const [created] = await db.insert(adminTables).values(payload).returning();

    res.status(201).json({ data: created });
  }),
);

tablesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const method = "PATCH /tables/:id";

    const id = getRequiredStringForEq({
      value: req.params.id,
      field: "id",
      method,
      res,
    });

    if (!id) {
      return;
    }

    const payload = updateTableSchema.parse(req.body);

    const [updated] = await db
      .update(adminTables)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(adminTables.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({
        error: "Table not found",
        method,
        field: "id",
        value: id,
        reason: "No table found with provided id",
      });
      return;
    }

    res.json({ data: updated });
  }),
);

tablesRouter.delete(
  "/",
  asyncHandler(async (req, res) => {
    const method = "DELETE /tables";

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

    const deletedTables = await db.transaction(async (tx) => {
      await tx
        .update(adminFields)
        .set({
          relation: null,
          relationTargetTableId: null,
          updatedAt: new Date(),
        })
        .where(inArray(adminFields.relationTargetTableId, ids));

      await tx.delete(adminFields).where(inArray(adminFields.tableId, ids));

      return tx
        .delete(adminTables)
        .where(inArray(adminTables.id, ids))
        .returning();
    });

    res.json({
      data: deletedTables,
      total: deletedTables.length,
    });
  }),
);

tablesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const method = "DELETE /tables/:id";

    const id = getRequiredStringForEq({
      value: req.params.id,
      field: "id",
      method,
      res,
    });

    if (!id) {
      return;
    }

    const [deletedTable] = await db.transaction(async (tx) => {
      await tx
        .update(adminFields)
        .set({
          relation: null,
          relationTargetTableId: null,
          updatedAt: new Date(),
        })
        .where(eq(adminFields.relationTargetTableId, id));

      await tx.delete(adminFields).where(eq(adminFields.tableId, id));

      return tx.delete(adminTables).where(eq(adminTables.id, id)).returning();
    });

    if (!deletedTable) {
      res.status(404).json({
        error: "Table not found",
        method,
        field: "id",
        value: id,
        reason: "No table found with provided id",
      });
      return;
    }

    res.json({
      data: deletedTable,
    });
  }),
);
