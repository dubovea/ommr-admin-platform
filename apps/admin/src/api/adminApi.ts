import type {
  AdminFieldMeta,
  AdminTableMeta,
  UpdateAdminFieldInput,
  UpdateAdminTableInput
} from "@ommr/shared";

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

export async function getTables(): Promise<AdminTableMeta[]> {
  const response = await request<{ data: AdminTableMeta[] }>(`${API_URL}/tables`);
  return response.data;
}

export async function getTable(id: string): Promise<AdminTableMeta> {
  const response = await request<{ data: AdminTableMeta }>(`${API_URL}/tables/${id}`);
  return response.data;
}

export async function updateTable(
  id: string,
  payload: UpdateAdminTableInput
): Promise<AdminTableMeta> {
  const response = await request<{ data: AdminTableMeta }>(`${API_URL}/tables/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

  return response.data;
}

export async function updateField(
  id: string,
  payload: UpdateAdminFieldInput
): Promise<AdminFieldMeta> {
  const response = await request<{ data: AdminFieldMeta }>(`${API_URL}/fields/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

  return response.data;
}
