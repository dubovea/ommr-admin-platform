import { BACKEND_BASE_URL } from "@/assets/constants";
import type { AdminApiListResponse } from "@ommr/shared";
import type {
  CreateResponse,
  GetOneResponse,
  HttpError,
} from "@refinedev/core";
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

type ApiErrorIssue = {
  path?: Array<string | number>;
  message?: string;
  code?: string;
};

type ApiErrorPayload = {
  message?: string;
  error?: string;

  errors?: HttpError["errors"];
  issues?: ApiErrorIssue[];
  field?: string;
  reason?: string;

  data?: {
    message?: string;
    error?: string;
    errors?: HttpError["errors"];
    issues?: ApiErrorIssue[];
    field?: string;
    reason?: string;
  };
};

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

async function parseText(response: Response): Promise<string | undefined> {
  try {
    const text = await response.clone().text();
    return text || undefined;
  } catch {
    return undefined;
  }
}

function getErrorIssues(payload?: ApiErrorPayload): ApiErrorIssue[] {
  return payload?.issues ?? payload?.data?.issues ?? [];
}

function normalizeIssueErrors(
  issues: ApiErrorIssue[],
): Record<string, string> | undefined {
  if (!issues.length) {
    return undefined;
  }

  return issues.reduce<Record<string, string>>((acc, issue) => {
    const key = issue.path?.length ? issue.path.join(".") : "root";
    acc[key] = issue.message || "Invalid value";
    return acc;
  }, {});
}

function getFirstIssueMessage(issues: ApiErrorIssue[]) {
  return issues.find((issue) => issue.message)?.message;
}

async function buildHttpError(response: Response): Promise<HttpError> {
  const payload = await parseJson<ApiErrorPayload>(response);
  const text = payload ? undefined : await parseText(response);

  const issues = getErrorIssues(payload);

  const issueErrors = normalizeIssueErrors(issues);
  const field = payload?.field ?? payload?.data?.field;
  const fieldReason =
    payload?.reason ||
    payload?.data?.reason ||
    payload?.message ||
    payload?.error ||
    payload?.data?.message ||
    payload?.data?.error;

  const fieldError =
    field && fieldReason
      ? {
          [field]: fieldReason,
        }
      : undefined;

  const errors =
    payload?.errors ?? payload?.data?.errors ?? issueErrors ?? fieldError;

  const message =
    payload?.message ||
    payload?.error ||
    payload?.data?.message ||
    payload?.data?.error ||
    payload?.reason ||
    payload?.data?.reason ||
    getFirstIssueMessage(issues) ||
    text ||
    response.statusText ||
    "Request failed.";

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

const transformError = async (response: Response): Promise<HttpError> => {
  return buildHttpError(response);
};

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

    transformError,
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

    transformError,
  },

  deleteOne: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,

    mapResponse: async (response, params) => {
      await assertOk(response);

      const payload = await parseJson<GetOneResponse>(response);

      return payload?.data ?? { id: params.id };
    },

    transformError,
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
