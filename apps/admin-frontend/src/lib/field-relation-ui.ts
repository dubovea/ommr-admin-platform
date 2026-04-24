import type {
  AdminFieldMeta,
  AdminTableMeta,
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

export function getSelectedRelationTable(params: {
  tablesData: AdminTableMeta[];
  field: AdminFieldMeta;
}) {
  const { tablesData, field } = params;

  return (
    tablesData.find((table) => table.id === field.relation?.targetTableId) ??
    null
  );
}

export function getRelationFields(table?: AdminTableMeta | null) {
  return table?.fields ?? [];
}

export function createTargetTableRelationPatch(
  targetTableId: string,
): UpdateAdminFieldInput {
  return {
    relation: {
      targetTableId,
    },
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
      targetKey: key === "targetKey" ? value : field.relation.targetKey,
      displayField:
        key === "displayField" ? value : field.relation.displayField,
      additionalText:
        key === "additionalText" ? value : field.relation.additionalText,
    },
  };
}