import type { DataProvider } from "@refinedev/core";

const API_URL = "/api/admin";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

export const dataProvider: DataProvider = {
  getList: async ({ resource }) => {
    const response = await request<{ data: unknown[]; total: number }>(`${API_URL}/${resource}`);

    return {
      data: response.data,
      total: response.total
    };
  },

  getOne: async ({ resource, id }) => {
    const response = await request<{ data: unknown }>(`${API_URL}/${resource}/${id}`);

    return {
      data: response.data
    };
  },

  create: async ({ resource, variables }) => {
    const response = await request<{ data: unknown }>(`${API_URL}/${resource}`, {
      method: "POST",
      body: JSON.stringify(variables)
    });

    return {
      data: response.data
    };
  },

  update: async ({ resource, id, variables }) => {
    const response = await request<{ data: unknown }>(`${API_URL}/${resource}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(variables)
    });

    return {
      data: response.data
    };
  },

  deleteOne: async ({ resource, id }) => {
    const response = await request<{ data: unknown }>(`${API_URL}/${resource}/${id}`, {
      method: "DELETE"
    });

    return {
      data: response.data
    };
  },

  getApiUrl: () => API_URL
};
