import { UpdateAdminFieldInput } from "@ommr/shared";

export function parseIdsQuery(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [...new Set(value.map(String).filter(Boolean))];
  }

  if (typeof value === "string") {
    return [
      ...new Set(
        value
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    ];
  }

  return [];
}

export function normalizeFieldUpdatePayload(payload: UpdateAdminFieldInput) {
  const isSelectLike =
    payload.inputType === "select" || payload.inputType === "multiselect";

  if (payload.inputType && !isSelectLike) {
    return {
      ...payload,
      relation: null,
      options: null,
    };
  }

  return payload;
}
