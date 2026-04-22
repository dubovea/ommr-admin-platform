import { z } from "zod";

export const fieldInputTypeSchema = z.enum([
  "text",
  "number",
  "date",
  "time",
  "datetime",
  "select",
  "multiselect"
]);

export const tableStatusSchema = z.enum([
  "draft",
  "needs_setup",
  "ready",
  "partial"
]);

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
  canDelete: z.boolean().optional()
});

export const createTableSchema = z.object({
  name: z.string().min(1),
  dbName: z.string().min(1),
  label: z.string().min(1),
  description: z.string().nullable().optional(),
  status: tableStatusSchema.default("needs_setup"),
  source: z.enum(["pydantic", "manual"]).default("manual"),
  icon: z.string().default("table")
});

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
  relation: z
    .object({
      targetTable: z.string().min(1),
      relationType: z.enum(["many-to-one", "one-to-many", "one-to-one", "many-to-many"]),
      displayField: z.string().min(1)
    })
    .nullable()
    .optional()
});

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
  showInForm: z.boolean().default(true)
});
