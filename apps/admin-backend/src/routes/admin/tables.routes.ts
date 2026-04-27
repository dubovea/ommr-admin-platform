import { Router } from "express";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  not,
  or,
  sql,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";

import { db } from "../../db/index.js";
import { adminFields, adminTables } from "../../db/schema.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { createTableSchema, updateTableSchema } from "../../validation.js";
import { getRequiredStringForEq, parseIdsQuery } from "../../lib/utils.js";

export const tablesRouter = Router();

type ApiCrudFilter =
  | {
      field: string;
      operator: string;
      value?: unknown;
    }
  | {
      key?: string;
      operator: "or" | "and";
      value: ApiCrudFilter[];
    };

const tableFilterColumns: Record<string, AnyColumn> = {
  id: adminTables.id,
  name: adminTables.name,
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
};

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

function parseFiltersQuery(value: unknown): ApiCrudFilter[] {
  if (!value) {
    return [];
  }

  const rawValue = Array.isArray(value) ? value[0] : value;

  if (typeof rawValue !== "string" || rawValue.length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as ApiCrudFilter[];
  } catch {
    return [];
  }
}

function isConditionalFilter(
  filter: ApiCrudFilter,
): filter is Extract<ApiCrudFilter, { operator: "or" | "and" }> {
  return filter.operator === "or" || filter.operator === "and";
}

function isEmptyFilterValue(operator: string, value: unknown) {
  if (operator === "null" || operator === "nnull") {
    return false;
  }

  if (value === undefined || value === null || value === "") {
    return true;
  }

  if (Array.isArray(value) && value.length === 0) {
    return true;
  }

  return false;
}

function toArray(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [value];
}

function toStringValue(value: unknown) {
  return String(value ?? "");
}

function buildColumnFilterCondition(
  column: AnyColumn,
  operator: string,
  value: unknown,
): SQL | undefined {
  if (isEmptyFilterValue(operator, value)) {
    return undefined;
  }

  switch (operator) {
    case "eq":
      return eq(column, value);

    case "ne":
      return ne(column, value);

    case "lt":
      return lt(column, value);

    case "gt":
      return gt(column, value);

    case "lte":
      return lte(column, value);

    case "gte":
      return gte(column, value);

    case "in": {
      const values = toArray(value);

      if (values.length === 0) {
        return undefined;
      }

      return inArray(column, values);
    }

    case "nin": {
      const values = toArray(value);

      if (values.length === 0) {
        return undefined;
      }

      return not(inArray(column, values));
    }

    case "contains":
      return ilike(column, `%${toStringValue(value)}%`);

    case "ncontains":
      return not(ilike(column, `%${toStringValue(value)}%`));

    case "containss":
      return like(column, `%${toStringValue(value)}%`);

    case "ncontainss":
      return not(like(column, `%${toStringValue(value)}%`));

    case "startswith":
      return ilike(column, `${toStringValue(value)}%`);

    case "nstartswith":
      return not(ilike(column, `${toStringValue(value)}%`));

    case "startswiths":
      return like(column, `${toStringValue(value)}%`);

    case "nstartswiths":
      return not(like(column, `${toStringValue(value)}%`));

    case "endswith":
      return ilike(column, `%${toStringValue(value)}`);

    case "nendswith":
      return not(ilike(column, `%${toStringValue(value)}`));

    case "endswiths":
      return like(column, `%${toStringValue(value)}`);

    case "nendswiths":
      return not(like(column, `%${toStringValue(value)}`));

    case "between": {
      if (!Array.isArray(value) || value.length < 2) {
        return undefined;
      }

      return and(gte(column, value[0]), lte(column, value[1]));
    }

    case "nbetween": {
      if (!Array.isArray(value) || value.length < 2) {
        return undefined;
      }

      return or(lt(column, value[0]), gt(column, value[1]));
    }

    case "null":
      return isNull(column);

    case "nnull":
      return isNotNull(column);

    default:
      return undefined;
  }
}

function isNegativeOperator(operator: string) {
  return [
    "ne",
    "nin",
    "ncontains",
    "ncontainss",
    "nstartswith",
    "nstartswiths",
    "nendswith",
    "nendswiths",
    "nbetween",
  ].includes(operator);
}

function buildNameOrLabelFilterCondition(
  operator: string,
  value: unknown,
): SQL | undefined {
  const nameCondition = buildColumnFilterCondition(
    adminTables.name,
    operator,
    value,
  );

  const labelCondition = buildColumnFilterCondition(
    adminTables.label,
    operator,
    value,
  );

  const conditions = [nameCondition, labelCondition].filter(Boolean) as SQL[];

  if (conditions.length === 0) {
    return undefined;
  }

  /**
   * Для положительных операторов:
   * name contains value OR label contains value
   *
   * Для отрицательных:
   * name not contains value AND label not contains value
   */
  if (isNegativeOperator(operator)) {
    return and(...conditions);
  }

  return or(...conditions);
}

function buildFilterCondition(filter: ApiCrudFilter): SQL | undefined {
  if (isConditionalFilter(filter)) {
    const conditions = filter.value
      .map(buildFilterCondition)
      .filter(Boolean) as SQL[];

    if (conditions.length === 0) {
      return undefined;
    }

    if (filter.operator === "or") {
      return or(...conditions);
    }

    return and(...conditions);
  }

  if (filter.field === "name") {
    return buildNameOrLabelFilterCondition(filter.operator, filter.value);
  }

  const column = tableFilterColumns[filter.field];

  if (!column) {
    return undefined;
  }

  return buildColumnFilterCondition(column, filter.operator, filter.value);
}

function buildWhereFromFilters(filters: ApiCrudFilter[]) {
  const conditions = filters.map(buildFilterCondition).filter(Boolean) as SQL[];

  if (conditions.length === 0) {
    return undefined;
  }

  return and(...conditions);
}

tablesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const includeFields = req.query.includeFields === "true";

    const filters = parseFiltersQuery(req.query.filters);
    const where = buildWhereFromFilters(filters);

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

    // if (shouldPaginate) {
    //   tablesQuery = tablesQuery.limit(pageSize).offset(offset);
    // }

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
    console.log(ids)

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
