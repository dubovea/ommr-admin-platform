import { z } from "zod";
import {
  ADMIN_TABLE_SOURCES,
  ADMIN_TABLE_STATUSES,
  FIELD_INPUT_TYPES,
  type CreateAdminFieldInput,
  type CreateAdminTableInput,
  type FieldDefaultValue,
  type FieldOption,
  type FieldRelationMeta,
  type FieldValidationMeta,
  type UpdateAdminFieldInput,
  type UpdateAdminTableInput,
} from "@ommr/shared";

export const fieldInputTypeSchema = z.enum(FIELD_INPUT_TYPES);
export const tableStatusSchema = z.enum(ADMIN_TABLE_STATUSES);
export const tableSourceSchema = z.enum(ADMIN_TABLE_SOURCES);

export const fieldOptionSchema: z.ZodType<FieldOption> = z.object({
  label: z.string(),
  value: z.string(),
});

export const fieldValidationSchema: z.ZodType<FieldValidationMeta> = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
  minLength: z.number().nullable(),
  maxLength: z.number().nullable(),
  pattern: z.string().nullable(),
});

export const fieldRelationSchema: z.ZodType<FieldRelationMeta> = z.object({
  targetTable: z.string(),
  targetKey: z.string(),
  displayField: z.string(),
  additionalText: z.string().nullable().optional(),
});

export const fieldDefaultValueSchema: z.ZodType<FieldDefaultValue> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
  z.array(z.number()),
  z.record(z.string(), z.unknown()),
]);

export const createTableSchema: z.ZodType<CreateAdminTableInput> = z.object({
  name: z.string().min(1),
  dbName: z.string().min(1),
  label: z.string().min(1),
  description: z.string().nullable().optional(),
  status: tableStatusSchema.optional(),
  source: tableSourceSchema.optional(),
  icon: z.string().nullable().optional(),
});

export const updateTableSchema: z.ZodType<UpdateAdminTableInput> = z.object({
  name: z.string().min(1).optional(),
  dbName: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: tableStatusSchema.optional(),
  icon: z.string().nullable().optional(),
  canList: z.boolean().optional(),
  canCreate: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
});

export const createFieldSchema: z.ZodType<CreateAdminFieldInput> = z.object({
  tableId: z.string().uuid(),
  name: z.string().min(1),
  label: z.string().min(1),
  dbType: z.string().min(1),
  inputType: fieldInputTypeSchema,
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
  relation: fieldRelationSchema.nullable().optional(),
});

export const updateFieldSchema: z.ZodType<UpdateAdminFieldInput> = z.object({
  label: z.string().min(1).optional(),
  dbType: z.string().min(1).optional(),
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
  relation: fieldRelationSchema.nullable().optional(),
});