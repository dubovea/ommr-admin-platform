import type {
  RelationGraphRelation,
  RelationGraphTable,
  RelationGraphTableField,
} from "@/types/relations.types";

export const NODE_WIDTH = 340;
export const HEADER_HEIGHT = 58;
export const BODY_PADDING_Y = 12;
export const FIELD_ROW_HEIGHT = 34;
export const FIELD_ROW_GAP = 4;
export const FOOTER_HEIGHT = 30;

export type GraphField = RelationGraphTableField & {
  isHiddenRestMarker?: boolean;
};

export function getSourceHandle(tableName: string, fieldName: string) {
  return `source:${tableName}:${fieldName}`;
}

export function getTargetHandle(tableName: string, fieldName: string) {
  return `target:${tableName}:${fieldName}`;
}

export function getTableSourceFields(
  tableName: string,
  relations: RelationGraphRelation[],
) {
  return new Set(
    relations
      .filter((relation) => relation.sourceTable.name === tableName)
      .map((relation) => relation.sourceField.name),
  );
}

export function getTableTargetFields(
  tableName: string,
  relations: RelationGraphRelation[],
) {
  return new Set(
    relations
      .filter((relation) => relation.targetTable.name === tableName)
      .map((relation) => relation.targetField.name),
  );
}

export function getGraphFields(
  table: RelationGraphTable,
  relations: RelationGraphRelation[],
): GraphField[] {
  const sourceFieldNames = getTableSourceFields(table.name, relations);
  const targetFieldNames = getTableTargetFields(table.name, relations);

  const importantNames = new Set<string>([
    ...sourceFieldNames,
    ...targetFieldNames,
    "id",
    "code",
  ]);

  const fieldsByName = new Map(
    table.fields.map((field) => [field.name, field]),
  );

  const importantFields = table.fields.filter((field) =>
    importantNames.has(field.name),
  );

  const regularFields = table.fields
    .filter((field) => !importantNames.has(field.name))
    .slice(0, 3);

  const virtualFields: RelationGraphTableField[] = [...importantNames]
    .filter((fieldName) => !fieldsByName.has(fieldName))
    .map((fieldName) => ({
      id: `virtual:${table.name}:${fieldName}`,
      name: fieldName,
      label: fieldName,
      inputType: "text",
    }));

  return [...importantFields, ...virtualFields, ...regularFields];
}

export function getHiddenFieldsCount(
  table: RelationGraphTable,
  relations: RelationGraphRelation[],
) {
  const shownFieldNames = new Set(
    getGraphFields(table, relations).map((field) => field.name),
  );

  return table.fields.filter((field) => !shownFieldNames.has(field.name))
    .length;
}

export function getNodeHeight(
  table: RelationGraphTable,
  relations: RelationGraphRelation[],
) {
  const fields = getGraphFields(table, relations);
  const hiddenCount = getHiddenFieldsCount(table, relations);

  return (
    HEADER_HEIGHT +
    BODY_PADDING_Y * 2 +
    fields.length * FIELD_ROW_HEIGHT +
    Math.max(0, fields.length - 1) * FIELD_ROW_GAP +
    (hiddenCount > 0 ? FOOTER_HEIGHT : 0)
  );
}

export function getFieldCenterY(params: {
  table: RelationGraphTable;
  relations: RelationGraphRelation[];
  fieldName: string;
}) {
  const { table, relations, fieldName } = params;

  const fields = getGraphFields(table, relations);
  const index = Math.max(
    0,
    fields.findIndex((field) => field.name === fieldName),
  );

  return (
    HEADER_HEIGHT +
    BODY_PADDING_Y +
    index * (FIELD_ROW_HEIGHT + FIELD_ROW_GAP) +
    FIELD_ROW_HEIGHT / 2
  );
}
