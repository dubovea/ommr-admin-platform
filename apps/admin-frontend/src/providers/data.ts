import type { CrudFilter, CrudSorting, DataProvider, HttpError } from "@refinedev/core";

const API_URL = "/api/admin";
type ApiListResponse<T> = { data: T[]; total?: number };
type ApiOneResponse<T> = { data: T };

function appendFilters(searchParams: URLSearchParams, filters?: CrudFilter[]) {
  filters?.forEach((filter) => {
    if ("field" in filter && filter.operator === "eq") searchParams.set(filter.field, String(filter.value));
  });
}
function appendSorters(searchParams: URLSearchParams, sorters?: CrudSorting) {
  sorters?.forEach((sorter) => searchParams.append("sort", `${sorter.field}:${sorter.order}`));
}
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(url, { ...init, headers: { ...(isFormData ? {} : { "Content-Type": "application/json" }), ...(init?.headers ?? {}) } });
  if (!response.ok) { const error: HttpError = { message: (await response.text()) || response.statusText, statusCode: response.status }; throw error; }
  return response.json() as Promise<T>;
}

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    const searchParams = new URLSearchParams();
    if (pagination?.mode !== "off") { searchParams.set("page", String(pagination?.current ?? 1)); searchParams.set("pageSize", String(pagination?.pageSize ?? 10)); }
    appendFilters(searchParams, filters); appendSorters(searchParams, sorters);
    const qs = searchParams.toString();
    const response = await request<ApiListResponse<unknown>>(`${API_URL}/${resource}${qs ? `?${qs}` : ""}`);
    return { data: response.data, total: response.total ?? response.data.length };
  },
  getOne: async ({ resource, id }) => ({ data: (await request<ApiOneResponse<unknown>>(`${API_URL}/${resource}/${id}`)).data }),
  create: async ({ resource, variables }) => ({ data: (await request<ApiOneResponse<unknown>>(`${API_URL}/${resource}`, { method: "POST", body: JSON.stringify(variables) })).data }),
  update: async ({ resource, id, variables }) => ({ data: (await request<ApiOneResponse<unknown>>(`${API_URL}/${resource}/${id}`, { method: "PATCH", body: JSON.stringify(variables) })).data }),
  deleteOne: async ({ resource, id }) => ({ data: (await request<ApiOneResponse<unknown>>(`${API_URL}/${resource}/${id}`, { method: "DELETE" })).data }),
  custom: async ({ url, method, payload, query, headers }) => {
    const searchParams = new URLSearchParams();
    if (query) Object.entries(query).forEach(([key, value]) => value != null && searchParams.set(key, String(value)));
    const fullUrl = `${url}${searchParams.size ? `?${searchParams.toString()}` : ""}`;
    const httpMethod = method?.toUpperCase() ?? "GET";
    const shouldHaveBody = !["GET", "DELETE"].includes(httpMethod);
    const response = await request<ApiOneResponse<unknown> | unknown>(fullUrl, { method: httpMethod, headers, body: shouldHaveBody ? (payload instanceof FormData ? payload : JSON.stringify(payload ?? {})) : undefined });
    if (typeof response === "object" && response && "data" in response) return { data: (response as ApiOneResponse<unknown>).data };
    return { data: response };
  },
  getApiUrl: () => API_URL,
};
