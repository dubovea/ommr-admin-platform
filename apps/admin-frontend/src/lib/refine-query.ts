import type { CrudFilter } from "@refinedev/core";

export const FILTERS_QUERY_KEY = "filters";

export type QueryParams = Record<string, string | number | boolean>;

export type SerializedCrudFilter =
  | {
      field: string;
      operator: string;
      value?: unknown;
    }
  | {
      key?: string;
      operator: "or" | "and";
      value: SerializedCrudFilter[];
    };

type ConditionalCrudFilter = CrudFilter & {
  key?: string;
  operator: "or" | "and";
  value: CrudFilter[];
};

function isConditionalFilter(
  filter: CrudFilter,
): filter is ConditionalCrudFilter {
  return filter.operator === "or" || filter.operator === "and";
}

function isSerializedCrudFilter(
  filter: SerializedCrudFilter | null,
): filter is SerializedCrudFilter {
  return filter !== null;
}

export function normalizeQueryValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeQueryValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        normalizeQueryValue(item),
      ]),
    );
  }

  return value;
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

export function serializeFilter(filter: CrudFilter): SerializedCrudFilter | null {
  if (isConditionalFilter(filter)) {
    const value = Array.isArray(filter.value)
      ? filter.value.map(serializeFilter).filter(isSerializedCrudFilter)
      : [];

    if (value.length === 0) {
      return null;
    }

    return {
      ...(filter.key ? { key: filter.key } : {}),
      operator: filter.operator,
      value,
    };
  }

  if (!("field" in filter)) {
    return null;
  }

  if (isEmptyFilterValue(filter.operator, filter.value)) {
    return null;
  }

  return {
    field: filter.field,
    operator: filter.operator,
    value: normalizeQueryValue(filter.value),
  };
}

export function buildFiltersParam(filters?: CrudFilter[]) {
  const serializedFilters = filters
    ?.map(serializeFilter)
    .filter(isSerializedCrudFilter);

  if (!serializedFilters?.length) {
    return undefined;
  }

  return JSON.stringify(serializedFilters);
}

export function appendQueryValue(
  params: QueryParams,
  key: string,
  value: unknown,
) {
  if (value === undefined || value === null) {
    return;
  }

  const normalizedValue = normalizeQueryValue(value);

  if (
    Array.isArray(normalizedValue) ||
    (normalizedValue && typeof normalizedValue === "object")
  ) {
    params[key] = JSON.stringify(normalizedValue);
    return;
  }

  params[key] = String(normalizedValue);
}
