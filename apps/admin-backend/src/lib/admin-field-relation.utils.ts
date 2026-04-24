import { asc, eq } from "drizzle-orm";
import type {
  CreateAdminFieldInput,
  FieldRelationInput,
  FieldRelationMeta,
  NormalizedCreateAdminFieldPayload,
  NormalizedUpdateAdminFieldPayload,
  UpdateAdminFieldInput,
} from "@ommr/shared";

import { db } from "../db/index.js";
import { adminFields, adminTables } from "../db/schema.js";

type DbOrTx = typeof db;

type AdminFieldRow = typeof adminFields.$inferSelect;

type NormalizedRelationResult = {
  relation: FieldRelationMeta | null;
  relationTargetTableId: string | null;
};

function isSelectLikeInputType(inputType: string | undefined | null) {
  return inputType === "select" || inputType === "multiselect";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasOwnKey<T extends object, K extends PropertyKey>(
  value: T,
  key: K,
): value is T & Record<K, unknown> {
  return key in value;
}

function pickDefaultTargetKey(fields: AdminFieldRow[]) {
  return (
    fields.find((field) => field.name === "id") ??
    fields.find((field) => field.required) ??
    fields[0] ??
    null
  );
}

function pickDefaultDisplayField(fields: AdminFieldRow[]) {
  return (
    fields.find((field) => field.name === "name") ??
    fields.find((field) => field.name === "label") ??
    fields.find(
      (field) =>
        field.visible &&
        ["text", "textarea", "select", "number"].includes(field.inputType),
    ) ??
    fields.find((field) => field.visible) ??
    fields[0] ??
    null
  );
}

async function getTargetTableWithFields(dbOrTx: DbOrTx, targetTableId: string) {
  const [targetTable] = await dbOrTx
    .select()
    .from(adminTables)
    .where(eq(adminTables.id, targetTableId));

  if (!targetTable) {
    return null;
  }

  const fields = await dbOrTx
    .select()
    .from(adminFields)
    .where(eq(adminFields.tableId, targetTableId))
    .orderBy(
      asc(adminFields.group),
      asc(adminFields.sortOrder),
      asc(adminFields.name),
    );

  return {
    table: targetTable,
    fields,
  };
}

function resolveRelationField(params: {
  requestedValue: string | null | undefined;
  fallbackValue: string | null | undefined;
  targetFields: AdminFieldRow[];
}) {
  const { requestedValue, fallbackValue, targetFields } = params;

  if (
    isNonEmptyString(requestedValue) &&
    targetFields.some((field) => field.name === requestedValue)
  ) {
    return requestedValue;
  }

  if (
    isNonEmptyString(fallbackValue) &&
    targetFields.some((field) => field.name === fallbackValue)
  ) {
    return fallbackValue;
  }

  return null;
}

function resolveAdditionalText(params: {
  relation: FieldRelationInput;
  previousRelation?: FieldRelationMeta | null;
  isSameTargetTable: boolean;
}) {
  const { relation, previousRelation, isSameTargetTable } = params;

  /**
   * Если frontend явно прислал additionalText,
   * значит сохраняем именно его значение, включая null.
   */
  if (hasOwnKey(relation, "additionalText")) {
    return relation.additionalText ?? null;
  }

  /**
   * Если таблица связи не менялась и additionalText не прислали,
   * сохраняем предыдущее значение.
   */
  if (isSameTargetTable) {
    return previousRelation?.additionalText ?? null;
  }

  return null;
}

async function normalizeRelationForSave(params: {
  dbOrTx: DbOrTx;
  relation: FieldRelationInput | null | undefined;
  previousRelation?: FieldRelationMeta | null;
}): Promise<NormalizedRelationResult | null> {
  const { dbOrTx, relation, previousRelation } = params;

  /**
   * relation не было в payload.
   * Значит ничего не меняем.
   */
  if (relation === undefined) {
    return null;
  }

  /**
   * relation: null — явная команда очистить связь.
   */
  if (relation === null) {
    return {
      relation: null,
      relationTargetTableId: null,
    };
  }

  const targetTableId = isNonEmptyString(relation.targetTableId)
    ? relation.targetTableId
    : previousRelation?.targetTableId;

  if (!isNonEmptyString(targetTableId)) {
    return {
      relation: null,
      relationTargetTableId: null,
    };
  }

  const target = await getTargetTableWithFields(dbOrTx, targetTableId);

  if (!target || target.fields.length === 0) {
    return {
      relation: null,
      relationTargetTableId: null,
    };
  }

  const defaultTargetKey = pickDefaultTargetKey(target.fields);
  const defaultDisplayField = pickDefaultDisplayField(target.fields);

  if (!defaultTargetKey || !defaultDisplayField) {
    return {
      relation: null,
      relationTargetTableId: null,
    };
  }

  const isSameTargetTable = previousRelation?.targetTableId === targetTableId;

  const targetKey =
    resolveRelationField({
      requestedValue: relation.targetKey,
      fallbackValue: isSameTargetTable ? previousRelation?.targetKey : null,
      targetFields: target.fields,
    }) ?? defaultTargetKey.name;

  const displayField =
    resolveRelationField({
      requestedValue: relation.displayField,
      fallbackValue: isSameTargetTable ? previousRelation?.displayField : null,
      targetFields: target.fields,
    }) ?? defaultDisplayField.name;

  return {
    relation: {
      targetTableId: target.table.id,
      targetTable: target.table.name,
      targetKey,
      displayField,
      additionalText: resolveAdditionalText({
        relation,
        previousRelation,
        isSameTargetTable,
      }),
    },
    relationTargetTableId: target.table.id,
  };
}

export async function normalizeFieldCreatePayloadForDb(params: {
  dbOrTx: DbOrTx;
  payload: CreateAdminFieldInput;
}): Promise<NormalizedCreateAdminFieldPayload> {
  const { dbOrTx, payload } = params;

  if (!isSelectLikeInputType(payload.inputType)) {
    return {
      ...payload,
      relation: null,
      relationTargetTableId: null,
      options: null,
    };
  }

  const normalizedRelation = await normalizeRelationForSave({
    dbOrTx,
    relation: payload.relation ?? null,
  });

  return {
    ...payload,
    relation: normalizedRelation?.relation ?? null,
    relationTargetTableId: normalizedRelation?.relationTargetTableId ?? null,
  };
}

export async function normalizeFieldUpdatePayloadForDb(params: {
  dbOrTx: DbOrTx;
  payload: UpdateAdminFieldInput;
  previousField: AdminFieldRow;
}): Promise<NormalizedUpdateAdminFieldPayload> {
  const { dbOrTx, payload, previousField } = params;

  const nextInputType = payload.inputType ?? previousField.inputType;

  if (!isSelectLikeInputType(nextInputType)) {
    return {
      ...payload,
      relation: null,
      relationTargetTableId: null,
      options: null,
    };
  }

  /**
   * Если relation не пришла в PATCH,
   * значит relation не трогаем.
   */
  if (!hasOwnKey(payload, "relation")) {
    return payload;
  }

  const normalizedRelation = await normalizeRelationForSave({
    dbOrTx,
    relation: payload.relation,
    previousRelation: previousField.relation,
  });

  if (!normalizedRelation) {
    return payload;
  }

  return {
    ...payload,
    relation: normalizedRelation.relation,
    relationTargetTableId: normalizedRelation.relationTargetTableId,
  };
}