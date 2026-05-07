import {
  DEFAULT_FIELD_VALIDATION,
  SIDEBAR_ITEMS,
  type CreateAdminFieldInput,
  type FieldDefaultValue,
  type FieldInputType,
  type FieldOption,
  type FieldRelationInput,
} from "@ommr/shared";

type SidebarGroupItem = {
  id: string;
  label: string;
  elements: Array<{
    id: string;
    label: string;
  }>;
};

type TableGroupMeta = {
  group: string;
  groupName: string;
};

type TableRootProperties = {
  label: string | null;
  group: string | null;
  groupName: string | null;
  showInMenu: boolean;
};

type JsonSchemaRelation = {
  to_table?: string;
  link_key?: string;
  display_field?: string;
  additional_text?: string | null;
};

type JsonSchema = {
  title?: string;
  description?: string;
  type?: string | string[];
  format?: string;
  properties?: Record<string, JsonSchema>;
  required?: boolean;
  enum?: unknown[];
  default?: unknown;
  items?: JsonSchema;
  $ref?: string;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  $defs?: Record<string, JsonSchema>;
  definitions?: Record<string, JsonSchema>;
  components?: { schemas?: Record<string, JsonSchema> };
  "x-relation"?: JsonSchemaRelation;
  "x-group"?: string;
  "x-group-name"?: string;
};

type ExtractedSchemaEntry = {
  /**
   * Имя root-свойства, под которым таблица подключена в основной модели.
   * Например: cargoes, tracks, shipments.
   */
  tableName: string;

  /**
   * Схема таблицы из $defs / definitions / components.schemas.
   */
  modelSchema: JsonSchema;

  /**
   * Root-свойство из основной модели.
   * Именно здесь лежат title / x-group / x-group-name для таблицы.
   */
  rootPropertySchema?: JsonSchema;
};

export type ParsedPydanticField = Omit<CreateAdminFieldInput, "tableId">;

export type ParsedPydanticTable = {
  name: string;
  dbName: string;
  label: string;
  description: string | null;
  group: string | null;
  groupName: string | null;
  showInMenu: boolean;
  fields: ParsedPydanticField[];
};

const TABLE_GROUPS_BY_NAME = buildTableGroupsByName(SIDEBAR_ITEMS);

export function parsePydanticJsonSchema(input: unknown): ParsedPydanticTable[] {
  const raw = input as Record<string, unknown>;

  const schema = (
    raw?.schema && typeof raw.schema === "object" ? raw.schema : input
  ) as JsonSchema;

  const schemas = extractSchemas(schema);

  return schemas.map(
    ({ tableName: rawTableName, modelSchema, rootPropertySchema }) => {
      const tableName = toSnakeCase(rawTableName);
      const tableRootProperties = getTableRootProperties(
        tableName,
        rootPropertySchema,
      );

      return {
        name: tableName,
        dbName: tableName,
        label: modelSchema?.title ?? "",

        description: modelSchema.description ?? null,

        group: tableRootProperties.group,
        groupName: tableRootProperties.groupName,
        showInMenu: tableRootProperties.showInMenu,

        fields: Object.entries(modelSchema.properties ?? {}).map(
          ([fieldName, fieldSchema], index) => {
            const resolved = resolveNullable(fieldSchema);
            const relation = getRelation(resolved);
            const options = getOptions(resolved);
            return {
              name: fieldName,
              label: getFieldLabel(fieldName, resolved),
              dbType: getDbType(resolved, relation),
              inputType: relation ? "multiselect" : getInputType(resolved),

              required: resolved.required ?? false,
              editable: fieldName !== "id" && !fieldName.endsWith("_at"),
              sortable: true,
              filterable: true,
              visible: fieldName !== "id" && !fieldName.endsWith("_at"),

              group: null,

              defaultValue: getDefaultValue(resolved),
              options,
              validation: DEFAULT_FIELD_VALIDATION,

              placeholder: null,
              helpText: resolved.description ?? null,

              relation,

              sortOrder: index + 1,
            } satisfies ParsedPydanticField;
          },
        ),
      };
    },
  );
}

function buildTableGroupsByName(items: SidebarGroupItem[]) {
  const groupsByName = new Map<string, TableGroupMeta>();

  for (const group of items) {
    for (const element of group.elements) {
      groupsByName.set(normalizeTableName(element.id), {
        group: group.id,
        groupName: group.label,
      });
    }
  }

  return groupsByName;
}

function getTableRootProperties(
  tableName: string,
  rootPropertySchema?: JsonSchema,
): TableRootProperties {
  const label = getSchemaTitle(rootPropertySchema);

  const fallbackGroupMeta = TABLE_GROUPS_BY_NAME.get(
    normalizeTableName(tableName),
  );

  const group =
    getNonEmptyString(rootPropertySchema?.["x-group"]) ??
    fallbackGroupMeta?.group ??
    null;

  const groupName =
    getNonEmptyString(rootPropertySchema?.["x-group-name"]) ??
    fallbackGroupMeta?.groupName ??
    null;

  return {
    label,
    group,
    groupName,
    showInMenu: Boolean(group && groupName),
  };
}

function extractSchemas(schema: JsonSchema): ExtractedSchemaEntry[] {
  const defs =
    schema.components?.schemas ?? schema.$defs ?? schema.definitions ?? null;

  if (defs && schema.type === "object" && schema.properties) {
    const referencedEntries = Object.entries(schema.properties).flatMap(
      ([propertyName, propertySchema]): ExtractedSchemaEntry[] => {
        const ref = propertySchema.$ref ?? propertySchema.items?.$ref;

        if (!ref) return [];

        const targetName = ref.split("/").pop();
        if (!targetName) return [];

        const targetSchema = defs[targetName];
        if (!targetSchema) return [];

        return [
          {
            tableName: propertyName,
            modelSchema: targetSchema,
            rootPropertySchema: propertySchema,
          },
        ];
      },
    );

    if (referencedEntries.length > 0) {
      return referencedEntries;
    }
  }

  if (defs) {
    return Object.entries(defs).map(([fallbackName, modelSchema]) => ({
      tableName: toSnakeCase(fallbackName),
      modelSchema,
    }));
  }

  if (schema.type === "object" && schema.properties) {
    const tableName = toSnakeCase(schema.title || "ImportedModel");

    return [
      {
        tableName,
        modelSchema: schema,
        rootPropertySchema: schema,
      },
    ];
  }

  throw new Error("Unsupported Pydantic schema format");
}

function resolveNullable(schema: JsonSchema): JsonSchema {
  const variants = schema.anyOf ?? schema.oneOf;
  const resolvedVariant = variants?.find((variant) => variant.type !== "null");

  if (!resolvedVariant) {
    return schema;
  }

  /**
   * В Pydantic JSON Schema default/title/description часто лежат на wrapper-узле
   * с anyOf/oneOf, а type/items/format — внутри non-null варианта.
   * Поэтому сохраняем тип из resolvedVariant, но переносим metadata с исходной схемы.
   */
  return {
    ...resolvedVariant,
    title: schema.title ?? resolvedVariant.title,
    description: schema.description ?? resolvedVariant.description,
    default: hasOwn(schema, "default")
      ? schema.default
      : resolvedVariant.default,
    enum: schema.enum ?? resolvedVariant.enum,
    format: schema.format ?? resolvedVariant.format,
    items: schema.items ?? resolvedVariant.items,
    "x-relation": schema["x-relation"] ?? resolvedVariant["x-relation"],
  };
}

function getRelation(schema: JsonSchema): FieldRelationInput | null {
  const relation = schema["x-relation"];

  if (relation?.to_table && relation?.link_key && relation?.display_field) {
    return {
      targetTable: toSnakeCase(relation.to_table),
      targetKey: relation.link_key,
      displayField: relation.display_field,
      additionalText: relation.additional_text ?? null,
    };
  }

  if (schema.$ref) {
    const targetName = schema.$ref.split("/").pop();
    if (!targetName) return null;

    return {
      targetTable: toSnakeCase(targetName),
      targetKey: "id",
      displayField: "name",
      additionalText: null,
    };
  }

  return null;
}

function getOptions(schema: JsonSchema): FieldOption[] | null {
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum.map((item) => ({
      label: String(item),
      value: String(item),
    }));
  }

  if (schema.type === "array" && schema.items?.enum?.length) {
    return schema.items.enum.map((item) => ({
      label: String(item),
      value: String(item),
    }));
  }

  return null;
}

function getDefaultValue(schema: JsonSchema): FieldDefaultValue | null {
  if (!hasOwn(schema, "default")) {
    return null;
  }

  return normalizeDefaultValue(schema.default);
}

function normalizeDefaultValue(value: unknown): FieldDefaultValue | null {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) {
      return value;
    }

    if (value.every((item) => typeof item === "number")) {
      return value;
    }

    return null;
  }

  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return null;
}

function getInputType(schema: JsonSchema): FieldInputType {
  if (schema.type === "boolean") return "checkbox";
  if (schema.enum) return "select";
  if (schema.type === "array") return "multiselect";
  if (schema.format === "date-time") return "datetime";
  if (schema.format === "date") return "date";
  if (schema.format === "time") return "time";
  if (schema.type === "integer") return "integer";
  if (schema.type === "number") return "float";

  return "text";
}

function getDbType(
  schema: JsonSchema,
  relation: FieldRelationInput | null,
): string {
  if (relation) return "relation";
  if (schema.enum) return "enum";
  if (schema.type === "array") return "array";
  if (schema.format === "date-time") return "datetime";
  if (schema.format === "date") return "date";
  if (schema.format === "time") return "time";
  if (schema.type === "integer") return "int";
  if (schema.type === "number") return "decimal";
  if (schema.type === "boolean") return "boolean";

  return "str";
}

function getSchemaTitle(schema?: JsonSchema): string | null {
  return getNonEmptyString(schema?.title);
}

function getFieldLabel(fieldName: string, schema: JsonSchema): string {
  return getSchemaTitle(schema) ?? toTitle(fieldName);
}

function getNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTableName(value: string) {
  return toSnakeCase(value).trim().toLowerCase();
}

function toSnakeCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

function toTitle(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function hasOwn<T extends object, K extends PropertyKey>(
  value: T,
  key: K,
): value is T & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(value, key);
}
