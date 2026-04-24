import type {
  CreateAdminFieldInput,
  NormalizedCreateAdminFieldPayload,
  NormalizedUpdateAdminFieldPayload,
  UpdateAdminFieldInput,
} from "@ommr/shared";

import type { Response } from "express";

export function getRequiredStringForEq(params: {
  value: unknown;
  field: string;
  method: string;
  res: Response;
}): string | null {
  const { value, field, method, res } = params;

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  const reason =
    value === undefined
      ? "Expected string, received undefined"
      : value === null
        ? "Expected string, received null"
        : Array.isArray(value)
          ? "Expected string, received array"
          : `Expected string, received ${typeof value}`;

  res.status(400).json({
    error: "Invalid field value",
    method,
    field,
    value,
    reason,
  });

  return null;
}

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

export function normalizeFieldCreatePayload(
  payload: CreateAdminFieldInput,
): NormalizedCreateAdminFieldPayload {
  const isSelectLike =
    payload.inputType === "select" || payload.inputType === "multiselect";

  if (!isSelectLike) {
    return {
      ...payload,
      relation: null,
      relationTargetTableId: null,
      options: null,
    };
  }

  const relation = payload.relation ?? null;

  return {
    ...payload,
    relation,
    relationTargetTableId: relation?.targetTableId ?? null,
  };
}

export function normalizeFieldUpdatePayload(
  payload: UpdateAdminFieldInput,
): NormalizedUpdateAdminFieldPayload {
  const isSelectLike =
    payload.inputType === "select" || payload.inputType === "multiselect";

  if (payload.inputType && !isSelectLike) {
    return {
      ...payload,
      relation: null,
      relationTargetTableId: null,
      options: null,
    };
  }

  if ("relation" in payload) {
    const relation = payload.relation ?? null;

    return {
      ...payload,
      relation,
      relationTargetTableId: relation?.targetTableId ?? null,
    };
  }

  return payload;
}
