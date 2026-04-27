import { BACKEND_BASE_URL } from "@/assets/constants";
import type { AdminApiListResponse } from "@ommr/shared";
import type { CreateResponse, GetOneResponse, HttpError } from "@refinedev/core";
import {
  createDataProvider,
  type CreateDataProviderOptions,
} from "@refinedev/rest";
import {
  buildFiltersParam,
  FILTERS_QUERY_KEY,
  type QueryParams,
} from "@/lib/refine-query";

if (!BACKEND_BASE_URL) {
  throw new Error("BACKEND_BASE_URL is not defined");
}

type ApiListResponse = AdminApiListResponse;

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
} satisfies CreateDataProviderOptions;

const { dataProvider } = createDataProvider(BACKEND_BASE_URL, options);

export { dataProvider };
