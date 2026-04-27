import {
  and,
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
  type AnyColumn,
  type SQL,
} from "drizzle-orm";

export type ApiCrudFilter =
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

export type FilterColumnMap = Record<string, AnyColumn>;

export type BuildCrudFiltersWhereOptions = {
  fieldHandlers?: Record<
    string,
    (operator: string, value: unknown) => SQL | undefined
  >;
};

export function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function parseFiltersQuery(value: unknown): ApiCrudFilter[] {
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

export function isConditionalFilter(
  filter: ApiCrudFilter,
): filter is Extract<ApiCrudFilter, { operator: "or" | "and" }> {
  return filter.operator === "or" || filter.operator === "and";
}

export function isEmptyFilterValue(operator: string, value: unknown) {
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

export function getLogicalFilterValue(
  filters: ApiCrudFilter[],
  field: string,
  operator = "eq",
): unknown {
  for (const filter of filters) {
    if (isConditionalFilter(filter)) {
      const nestedValue = getLogicalFilterValue(filter.value, field, operator);

      if (nestedValue !== undefined) {
        return nestedValue;
      }

      continue;
    }

    if (filter.field === field && filter.operator === operator) {
      return filter.value;
    }
  }

  return undefined;
}

export function buildEqFilter(field: string, value: unknown): ApiCrudFilter {
  return {
    field,
    operator: "eq",
    value,
  };
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

function combineConditions(
  operator: "and" | "or",
  conditions: SQL[],
): SQL | undefined {
  if (conditions.length === 0) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  if (operator === "or") {
    return or(...conditions);
  }

  return and(...conditions);
}

export function isNegativeFilterOperator(operator: string) {
  return [
    "ne",
    "nes",
    "nin",
    "nina",
    "ncontains",
    "ncontainss",
    "nstartswith",
    "nstartswiths",
    "nendswith",
    "nendswiths",
    "nbetween",
  ].includes(operator);
}

export function buildColumnFilterCondition(
  column: AnyColumn,
  operator: string,
  value: unknown,
): SQL | undefined {
  if (isEmptyFilterValue(operator, value)) {
    return undefined;
  }

  switch (operator) {
    case "eq":
    case "eqs":
      return eq(column, value);

    case "ne":
    case "nes":
      return ne(column, value);

    case "lt":
      return lt(column, value);

    case "gt":
      return gt(column, value);

    case "lte":
      return lte(column, value);

    case "gte":
      return gte(column, value);

    case "in":
    case "ina": {
      const values = toArray(value);

      if (values.length === 0) {
        return undefined;
      }

      return inArray(column, values);
    }

    case "nin":
    case "nina": {
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

export function buildMultiColumnFilterCondition(
  columns: AnyColumn[],
  operator: string,
  value: unknown,
): SQL | undefined {
  const conditions = columns
    .map((column) => buildColumnFilterCondition(column, operator, value))
    .filter(Boolean) as SQL[];

  return combineConditions(
    isNegativeFilterOperator(operator) ? "and" : "or",
    conditions,
  );
}

export function buildCrudFilterCondition(
  filter: ApiCrudFilter,
  columns: FilterColumnMap,
  options: BuildCrudFiltersWhereOptions = {},
): SQL | undefined {
  if (isConditionalFilter(filter)) {
    const conditions = filter.value
      .map((nestedFilter) =>
        buildCrudFilterCondition(nestedFilter, columns, options),
      )
      .filter(Boolean) as SQL[];

    return combineConditions(filter.operator, conditions);
  }

  const customCondition = options.fieldHandlers?.[filter.field]?.(
    filter.operator,
    filter.value,
  );

  if (customCondition) {
    return customCondition;
  }

  const column = columns[filter.field];

  if (!column) {
    return undefined;
  }

  return buildColumnFilterCondition(column, filter.operator, filter.value);
}

export function buildWhereFromCrudFilters(
  filters: ApiCrudFilter[],
  columns: FilterColumnMap,
  options: BuildCrudFiltersWhereOptions = {},
): SQL | undefined {
  const conditions = filters
    .map((filter) => buildCrudFilterCondition(filter, columns, options))
    .filter(Boolean) as SQL[];

  return combineConditions("and", conditions);
}
