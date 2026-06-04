import { z } from "zod";
import {
  ADMIN_TABLE_SOURCES,
  ADMIN_TABLE_STATUSES,
  DEFAULT_FIELD_VALIDATION,
  FIELD_INPUT_TYPES,
  type CreateAdminFieldInput,
  type CreateAdminTableInput,
  type UpdateAdminFieldInput,
  type UpdateAdminTableInput,
} from "../index.js";

export const fieldInputTypeSchema = z.enum(FIELD_INPUT_TYPES);
export const tableStatusSchema = z.enum(ADMIN_TABLE_STATUSES);
export const tableSourceSchema = z.enum(ADMIN_TABLE_SOURCES);

export const fieldOptionSchema = z.object({
  label: z.string().min(1, "Введите label варианта"),
  value: z.string().min(1, "Введите value варианта"),
});

export const fieldValidationSchema = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
  minLength: z.number().nullable(),
  maxLength: z.number().nullable(),
  pattern: z.string().nullable(),
});

export const fieldRelationInputSchema = z.object({
  targetTableId: z.uuid().nullable().optional(),
  targetTable: z.string().nullable().optional(),
  targetKey: z.string().nullable().optional(),
  displayField: z.string().nullable().optional(),
  additionalText: z.string().nullable().optional(),
});

export const fieldRelationMetaSchema = z.object({
  targetTableId: z.uuid(),
  targetTable: z.string().min(1),
  targetKey: z.string().min(1),
  displayField: z.string().min(1),
  additionalText: z.string().nullable().optional(),
});

export const fieldDefaultValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
  z.array(z.number()),
  z.record(z.string(), z.unknown()),
]);

export const tableFormSchema = z.object({
  name: z.string().trim().min(1, "Введите имя таблицы в БД"),
  label: z.string().trim().min(1, "Введите отображаемое имя"),

  group: z.string().nullable().default(null),
  groupName: z.string().nullable().default(null),
  description: z.string().nullable().default(null),

  status: tableStatusSchema.default("draft"),
  source: tableSourceSchema.default("manual"),
  icon: z.string().nullable().default("table"),

  showInMenu: z.boolean().default(true),
  canList: z.boolean().default(true),
  canCreate: z.boolean().default(true),
  canEdit: z.boolean().default(true),
  canDelete: z.boolean().default(true),
});

export type AdminTableFormValues = z.infer<typeof tableFormSchema>;

export const createTableSchema =
  tableFormSchema satisfies z.ZodType<CreateAdminTableInput>;

export type CreateTableDto = z.infer<typeof createTableSchema>;

export const updateTableSchema = z.object({
  name: z.string().trim().min(1, "Введите имя таблицы в БД").optional(),
  label: z.string().trim().min(1, "Введите отображаемое имя").optional(),

  group: z.string().nullable().optional(),
  groupName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),

  status: tableStatusSchema.optional(),
  icon: z.string().nullable().optional(),

  showInMenu: z.boolean().optional(),
  canList: z.boolean().optional(),
  canCreate: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
}) satisfies z.ZodType<UpdateAdminTableInput>;

export type UpdateTableDto = z.infer<typeof updateTableSchema>;

export const createFieldSchema = z.object({
  tableId: z.uuid(),
  name: z.string().trim().min(1, "Введите имя поля"),
  label: z.string().trim().min(1, "Введите label поля"),
  dbType: z.string().nullable().optional(),
  inputType: fieldInputTypeSchema,

  required: z.boolean().default(false),
  editable: z.boolean().default(true),
  sortable: z.boolean().default(false),
  filterable: z.boolean().default(false),
  visible: z.boolean().default(true),

  group: z.string().nullable().optional(),
  defaultValue: fieldDefaultValueSchema.optional(),
  options: z.array(fieldOptionSchema).nullable().optional(),

  validation: fieldValidationSchema
    .nullable()
    .default(DEFAULT_FIELD_VALIDATION),

  placeholder: z.string().nullable().optional(),
  helpText: z.string().nullable().optional(),

  relation: fieldRelationInputSchema.nullable().optional(),

  sortOrder: z.number().int().positive().optional(),
}) satisfies z.ZodType<CreateAdminFieldInput>;

export type CreateFieldDto = z.infer<typeof createFieldSchema>;

export const updateFieldSchema = z.object({
  name: z.string().trim().min(1, "Введите имя поля").optional(),
  label: z.string().trim().min(1, "Введите label поля").optional(),
  dbType: z.string().nullable().optional(),
  inputType: fieldInputTypeSchema.optional(),

  required: z.boolean().optional(),
  editable: z.boolean().optional(),
  sortable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  visible: z.boolean().optional(),

  group: z.string().nullable().optional(),
  defaultValue: fieldDefaultValueSchema.optional(),
  options: z.array(fieldOptionSchema).nullable().optional(),

  validation: fieldValidationSchema.nullable().optional(),

  placeholder: z.string().nullable().optional(),
  helpText: z.string().nullable().optional(),

  relation: fieldRelationInputSchema.nullable().optional(),

  sortOrder: z.number().int().positive().optional(),
}) satisfies z.ZodType<UpdateAdminFieldInput>;

export type UpdateFieldDto = z.infer<typeof updateFieldSchema>;

export const importPydanticSchemaRequestSchema = z.object({
  schema: z.unknown(),
});

export type ImportPydanticSchemaRequest = z.infer<
  typeof importPydanticSchemaRequestSchema
>;
