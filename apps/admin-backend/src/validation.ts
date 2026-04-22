import { z } from "zod";
import {
  ADMIN_TABLE_SOURCES,
  ADMIN_TABLE_STATUSES,
  FIELD_INPUT_TYPES,
  RELATION_TYPES,
} from "@ommr/shared";

export const fieldInputTypeSchema = z.enum(FIELD_INPUT_TYPES);

export const tableStatusSchema = z.enum(ADMIN_TABLE_STATUSES);

export const tableSourceSchema = z.enum(ADMIN_TABLE_SOURCES);

export const relationTypeSchema = z.enum(RELATION_TYPES);

export const fieldRelationSchema = z.object({
  targetTable: z.string().min(1),
  relationType: relationTypeSchema,
  displayField: z.string().min(1),
});

export const updateTableSchema = z.object({
  label: z.string().min(1).optional(),
  dbName: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: tableStatusSchema.optional(),
  icon: z.string().nullable().optional(),
  canList: z.boolean().optional(),
  canCreate: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
});

export type UpdateTableDto = z.infer<typeof updateTableSchema>;

export const createTableSchema = z.object({
  name: z.string().min(1),
  dbName: z.string().min(1),
  label: z.string().min(1),
  description: z.string().nullable().optional(),
  status: tableStatusSchema.default("needs_setup"),
  source: tableSourceSchema.default("manual"),
  icon: z.string().default("table"),
});

export type CreateTableDto = z.infer<typeof createTableSchema>;

export const updateFieldSchema = z.object({
  label: z.string().min(1).optional(),
  dbType: z.string().min(1).optional(),
  inputType: fieldInputTypeSchema.optional(),
  required: z.boolean().optional(),
  editable: z.boolean().optional(),
  sortable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  showInList: z.boolean().optional(),
  showInForm: z.boolean().optional(),
  placeholder: z.string().nullable().optional(),
  helpText: z.string().nullable().optional(),
  relation: fieldRelationSchema.nullable().optional(),
});

export type UpdateFieldDto = z.infer<typeof updateFieldSchema>;

export const createFieldSchema = z.object({
  tableId: z.string().uuid(),
  name: z.string().min(1),
  label: z.string().min(1),
  dbType: z.string().min(1),
  inputType: fieldInputTypeSchema,
  required: z.boolean().default(false),
  editable: z.boolean().default(true),
  sortable: z.boolean().default(false),
  filterable: z.boolean().default(false),
  showInList: z.boolean().default(true),
  showInForm: z.boolean().default(true),
});

export type CreateFieldDto = z.infer<typeof createFieldSchema>;
