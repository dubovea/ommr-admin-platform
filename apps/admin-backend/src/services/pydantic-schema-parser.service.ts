import {
  DEFAULT_FIELD_VALIDATION,
  type CreateAdminFieldInput,
  type FieldInputType,
  type FieldOption,
  type FieldRelationMeta,
} from "@ommr/shared";

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
};

export type ParsedPydanticField = Omit<CreateAdminFieldInput, "tableId">;

export type ParsedPydanticTable = {
  name: string;
  label: string;
  description: string | null;
  fields: ParsedPydanticField[];
};

export function parsePydanticJsonSchema(input: unknown): ParsedPydanticTable[] {
  const schema = input as JsonSchema;
  const schemas = extractSchemas(schema);

  return Object.entries(schemas).map(([fallbackName, modelSchema]) => {
    const tableName = toSnakeCase(modelSchema.title || fallbackName);
    const required = new Set(modelSchema.required ?? []);

    return {
      name: tableName,
      label: modelSchema.title || toTitle(tableName),
      description: modelSchema.description ?? null,
      fields: Object.entries(modelSchema.properties ?? {}).map(
        ([fieldName, fieldSchema], index) => {
          const resolved = resolveNullable(fieldSchema);
          const relation = getRelation(resolved);
          const options = getOptions(resolved);

          return {
            name: fieldName,
            label: toTitle(fieldName),
            dbType: getDbType(resolved),
            inputType: relation
              ? resolved.type === "array"
                ? "multiselect"
                : "select"
              : getInputType(resolved),
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
          } satisfies ParsedPydanticField;
        },
      ),
    };
  });
}

function extractSchemas(schema: JsonSchema): Record<string, JsonSchema> {
  if (schema.components?.schemas) return schema.components.schemas;
  if (schema.$defs) return schema.$defs;
  if (schema.definitions) return schema.definitions;
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
  if (!schema.$ref) return null;

  const targetName = schema.$ref.split("/").pop();
  if (!targetName) return null;

  return {
    targetTable: toSnakeCase(targetName),
    targetKey: "id",
    displayField: "name",
    additionalText: null,
  };
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
  if (schema.type === "integer" || schema.type === "number") return "number";
  return "text";
}

function getDbType(schema: JsonSchema): string {
  if (schema.$ref) return "relation";
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
    .replace(/\w/g, (letter) => letter.toUpperCase());
}
