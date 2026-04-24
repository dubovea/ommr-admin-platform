import type {
  AdminFieldMeta,
  AdminTableMeta,
  FieldRelationInput,
  UpdateAdminFieldInput,
} from "@ommr/shared";

export function isSelectLikeInputType(inputType: AdminFieldMeta["inputType"]) {
  return inputType === "select" || inputType === "multiselect";
}

export function shouldShowRelationSettings(field: AdminFieldMeta) {
  return isSelectLikeInputType(field.inputType) || Boolean(field.relation);
}

export function getRelationTargetTables(
  tablesData: AdminTableMeta[],
  currentTableId: string,
) {
  return tablesData.filter(
    (table) => table.id !== currentTableId && (table.fields?.length ?? 0) > 0,
  );
}

export function getRelationFields(table?: AdminTableMeta | null) {
  return table?.fields ?? [];
}

function isDisplayFieldCandidate(field: AdminFieldMeta) {
  return (
    field.visible &&
    ["text", "textarea", "select", "number"].includes(field.inputType)
  );
}

export function getDefaultRelationFields(table: AdminTableMeta) {
  const fields = table.fields ?? [];

  const targetKeyField =
    fields.find((field) => field.name === "id") ??
    fields.find((field) => field.required) ??
    fields[0];

  const displayField =
    fields.find((field) => field.name === "name") ??
    fields.find((field) => field.name === "label") ??
    fields.find(isDisplayFieldCandidate) ??
    fields.find((field) => field.visible) ??
    fields[0];

  if (!targetKeyField || !displayField) {
    return null;
  }

  return {
    targetKey: targetKeyField.name,
    displayField: displayField.name,
  };
}

export function createTargetTableRelationPatch(
  targetTable: AdminTableMeta,
): UpdateAdminFieldInput {
  const defaults = getDefaultRelationFields(targetTable);

  return {
    relation: {
      targetTableId: targetTable.id,
      targetTable: targetTable.name,

      /**
       * Эти дефолты нужны для create-режима, потому что backend ещё не вызван.
       * В edit-режиме backend всё равно перепроверит и нормализует relation.
       */
      targetKey: defaults?.targetKey ?? null,
      displayField: defaults?.displayField ?? null,

      additionalText: null,
    } satisfies FieldRelationInput,
  };
}

export function createRelationFieldPatch(params: {
  field: AdminFieldMeta;
  key: "targetKey" | "displayField" | "additionalText";
  value: string | null;
}): UpdateAdminFieldInput | null {
  const { field, key, value } = params;

  if (!field.relation?.targetTableId) {
    return null;
  }

  return {
    relation: {
      targetTableId: field.relation.targetTableId,
      targetTable: field.relation.targetTable,

      targetKey:
        key === "targetKey" ? value : field.relation.targetKey,

      displayField:
        key === "displayField" ? value : field.relation.displayField,

      additionalText:
        key === "additionalText" ? value : field.relation.additionalText,
    },
  };
}