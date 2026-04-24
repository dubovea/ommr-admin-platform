import {
  DEFAULT_FIELD_VALIDATION,
  type CreateAdminFieldInput,
  type FieldInputType,
  type FieldOption,
  type FieldRelationMeta,
} from "@ommr/shared";

type JsonSchemaRelation = {
  to_table?: string;
  link_key?: string;
  display_field?: string;
};

type JsonSchema = {
  title?: string;
  description?: string;
  type?: string | string[];
  format?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
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
};

export type ParsedPydanticField = Omit<CreateAdminFieldInput, "tableId">;

export type ParsedPydanticTable = {
  name: string;
  dbName: string;
  label: string;
  description: string | null;
  fields: ParsedPydanticField[];
};

export function parsePydanticJsonSchema(input: unknown): ParsedPydanticTable[] {
  const raw = input as Record<string, unknown>;
  const schema = (
    raw?.schema && typeof raw.schema === "object" ? raw.schema : input
  ) as JsonSchema;

  const schemas = extractSchemas(schema);

  return Object.entries(schemas).map(([fallbackName, modelSchema]) => {
    const tableName = toSnakeCase(fallbackName);
    const required = new Set(modelSchema.required ?? []);

    return {
      name: tableName,
      dbName: tableName,
      label: modelSchema.description
        ? modelSchema.description.split?.(".")?.[0]
        : modelSchema.title || toTitle(fallbackName),
      description: modelSchema.description ?? null,
      fields: Object.entries(modelSchema.properties ?? {}).map(
        ([fieldName, fieldSchema], index) => {
          const resolved = resolveNullable(fieldSchema);
          const relation = getRelation(resolved);
          const options = getOptions(resolved);

          return {
            name: fieldName,
            label: toTitle(fieldName),
            dbType: getDbType(resolved, relation),
            inputType: relation ? "multiselect" : getInputType(resolved),
            required: required.has(fieldName),
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
  });
}

function extractSchemas(schema: JsonSchema): Record<string, JsonSchema> {
  const defs =
    schema.components?.schemas ?? schema.$defs ?? schema.definitions ?? null;

  if (defs && schema.type === "object" && schema.properties) {
    const referencedEntries = Object.entries(schema.properties)
      .map(([propertyName, propertySchema]) => {
        const ref = propertySchema.$ref ?? propertySchema.items?.$ref;

        if (!ref) return null;

        const targetName = ref.split("/").pop();
        if (!targetName) return null;

        const targetSchema = defs[targetName];
        if (!targetSchema) return null;

        return [propertyName, targetSchema] as const;
      })
      .filter(
        (entry): entry is readonly [string, JsonSchema] => entry !== null,
      );

    if (referencedEntries.length > 0) {
      return Object.fromEntries(referencedEntries);
    }
  }

  if (defs) {
    return defs;
  }

  if (schema.type === "object" && schema.properties) {
    return { [schema.title || "ImportedModel"]: schema };
  }

  throw new Error("Unsupported Pydantic schema format");
}

function resolveNullable(schema: JsonSchema): JsonSchema {
  const variants = schema.anyOf ?? schema.oneOf;
  return variants?.find((variant) => variant.type !== "null") ?? schema;
}

function getRelation(schema: JsonSchema): FieldRelationMeta | null {
  const relation = schema["x-relation"];

  if (relation?.to_table && relation?.link_key && relation?.display_field) {
    return {
      targetTable: toSnakeCase(relation.to_table),
      targetKey: relation.link_key,
      displayField: relation.display_field,
      additionalText: null,
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

function getDefaultValue(schema: JsonSchema) {
  return schema.default ?? null;
}

function getInputType(schema: JsonSchema): FieldInputType {
  if (schema.type === "boolean") return "checkbox";
  if (schema.enum) return "select";
  if (schema.type === "array") return "multiselect";
  if (schema.format === "date-time") return "datetime";
  if (schema.format === "date") return "date";
  if (schema.format === "time") return "time";
  if (schema.type === "integer") return "integer";
  if (schema.type === "float") return "float";
  return "text";
}

function getDbType(
  schema: JsonSchema,
  relation: FieldRelationMeta | null,
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
