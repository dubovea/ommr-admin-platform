import { BACKEND_BASE_URL } from "@/assets/constants";
import type { ListResponse } from "@/types";
import type {
  CreateResponse,
  CrudFilter,
  GetOneResponse,
  HttpError,
} from "@refinedev/core";
import {
  createDataProvider,
  type CreateDataProviderOptions,
} from "@refinedev/rest";

if (!BACKEND_BASE_URL) {
  throw new Error("BACKEND_BASE_URL is not defined in environment variables");
}

const FILTERS_QUERY_KEY = "filters";

type QueryParams = Record<string, string | number | boolean>;

type ApiListResponse = ListResponse & {
  total?: number;
  pagination?: {
    total?: number;
  };
};

type SerializedCrudFilter =
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

function normalizeQueryValue(value: unknown): unknown {
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

function serializeFilter(filter: CrudFilter): SerializedCrudFilter | null {
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

function buildFiltersParam(filters?: CrudFilter[]) {
  const serializedFilters = filters
    ?.map(serializeFilter)
    .filter(isSerializedCrudFilter);

  if (!serializedFilters?.length) {
    return undefined;
  }

  return JSON.stringify(serializedFilters);
}

function appendQueryValue(params: QueryParams, key: string, value: unknown) {
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

async function parseJson<T>(response: Response): Promise<T | undefined> {
  if (response.status === 204) {
    return undefined;
  }

  try {
    return (await response.clone().json()) as T;
  } catch {
    return undefined;
  }
}

async function buildHttpError(response: Response): Promise<HttpError> {
  let message = response.statusText || "Request failed.";
  let errors: HttpError["errors"] | undefined;

  try {
    const payload = (await response.clone().json()) as {
      message?: string;
      error?: string;
      errors?: HttpError["errors"];
      data?: {
        message?: string;
      };
    };

    message =
      payload?.message ||
      payload?.error ||
      payload?.data?.message ||
      response.statusText ||
      message;

    errors = payload?.errors;
  } catch {
    try {
      const text = await response.clone().text();
      message = text || message;
    } catch {
      // ignore
    }
  }

  return {
    message,
    statusCode: response.status,
    errors,
  };
}

async function assertOk(response: Response) {
  if (!response.ok) {
    throw await buildHttpError(response);
  }
}

function getListData(payload?: ApiListResponse) {
  return payload?.data ?? [];
}

function getListTotal(payload?: ApiListResponse) {
  return (
    payload?.total ?? payload?.pagination?.total ?? payload?.data?.length ?? 0
  );
}

function getOneData(payload?: GetOneResponse) {
  return payload?.data ?? {};
}

function getCreateData(payload?: CreateResponse) {
  return payload?.data ?? {};
}

function getResponseData<TData>(payload: unknown): TData {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: TData }).data;
  }

  return payload as TData;
}

const options = {
  getList: {
    getEndpoint: ({ resource }) => resource,

    buildQueryParams: async ({ pagination, filters, sorters, meta }) => {
      const params: QueryParams = {};

      if (pagination?.mode !== "off") {
        params.page = pagination?.currentPage ?? 1;
        params.pageSize = pagination?.pageSize ?? 10;
      }

      const filtersParam = buildFiltersParam(filters);

      if (filtersParam) {
        params[FILTERS_QUERY_KEY] = filtersParam;
      }

      if (sorters?.length) {
        params.sort = sorters
          .map((sorter) => `${sorter.field}:${sorter.order}`)
          .join(",");
      }

      if (meta?.includeFields) {
        params.includeFields = true;
      }

      return params;
    },

    mapResponse: async (response) => {
      await assertOk(response);

      const payload = await parseJson<ApiListResponse>(response);

      return getListData(payload);
    },

    getTotalCount: async (response) => {
      await assertOk(response);

      const payload = await parseJson<ApiListResponse>(response);

      return getListTotal(payload);
    },
  },

  getOne: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,

    mapResponse: async (response) => {
      await assertOk(response);

      const payload = await parseJson<GetOneResponse>(response);

      return getOneData(payload);
    },
  },

  create: {
    getEndpoint: ({ resource }) => resource,

    buildBodyParams: async ({ variables }) => variables,

    mapResponse: async (response) => {
      await assertOk(response);

      const payload = await parseJson<CreateResponse>(response);

      return getCreateData(payload);
    },
  },

  update: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,

    getRequestMethod: () => "patch",

    buildBodyParams: async ({ variables }) => variables,

    mapResponse: async (response) => {
      await assertOk(response);

      const payload = await parseJson<GetOneResponse>(response);

      return getOneData(payload);
    },
  },

  deleteOne: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,

    mapResponse: async (response, params) => {
      await assertOk(response);

      const payload = await parseJson<GetOneResponse>(response);

      return payload?.data ?? { id: params.id };
    },
  },

  deleteMany: {
    getEndpoint: ({ resource, ids }) => {
      const searchParams = new URLSearchParams();

      ids.forEach((id) => {
        searchParams.append("ids", String(id));
      });

      const qs = searchParams.toString();

      return `${resource}${qs ? `?${qs}` : ""}`;
    },

    mapResponse: async (response) => {
      await assertOk(response);

      const payload = await parseJson<ApiListResponse>(response);

      return getListData(payload);
    },
  },

  custom: {
    buildHeaders: async ({ headers, payload }) => {
      const isFormData = payload instanceof FormData;

      return {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(headers ?? {}),
      };
    },

    buildQueryParams: async ({ query, filters, sorters }) => {
      const params: QueryParams = {};

      if (query && typeof query === "object") {
        Object.entries(query as Record<string, unknown>).forEach(
          ([key, value]) => {
            appendQueryValue(params, key, value);
          },
        );
      }

      const filtersParam = buildFiltersParam(filters);

      if (filtersParam) {
        params[FILTERS_QUERY_KEY] = filtersParam;
      }

      if (sorters?.length) {
        params.sort = sorters
          .map((sorter) => `${sorter.field}:${sorter.order}`)
          .join(",");
      }

      return params;
    },

    buildBodyParams: async (params) => {
      const body =
        (params as { values?: unknown }).values ??
        (params as { payload?: unknown }).payload ??
        {};

      console.log("[dataProvider.custom] body:", body);

      return body;
    },

    mapResponse: async (response) => {
      await assertOk(response);

      const payload = await parseJson<unknown>(response);

      return getResponseData(payload);
    },
  },
} satisfies CreateDataProviderOptions;

const { dataProvider } = createDataProvider(BACKEND_BASE_URL, options);

export { dataProvider };
