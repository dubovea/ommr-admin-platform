import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  ADMIN_TABLE_SOURCES,
  ADMIN_TABLE_STATUSES,
  FIELD_INPUT_TYPES,
  type FieldDefaultValue,
  type FieldOption,
  type FieldRelationMeta,
  type FieldValidationMeta,
} from "@ommr/shared";

const toPgEnumValues = <T extends readonly [string, ...string[]]>(values: T) =>
  values as unknown as [T[number], ...T[number][]];

export const tableStatusEnum = pgEnum(
  "table_status",
  toPgEnumValues(ADMIN_TABLE_STATUSES),
);

export const tableSourceEnum = pgEnum(
  "table_source",
  toPgEnumValues(ADMIN_TABLE_SOURCES),
);

export const fieldInputTypeEnum = pgEnum(
  "field_input_type",
  toPgEnumValues(FIELD_INPUT_TYPES),
);

export const adminFields = pgTable("admin_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableId: uuid("table_id").notNull(),

  name: text("name").notNull(),
  label: text("label").notNull(),
  dbType: text("db_type").notNull(),
  inputType: fieldInputTypeEnum("input_type").notNull(),

  required: boolean("required").notNull().default(false),
  editable: boolean("editable").notNull().default(true),
  sortable: boolean("sortable").notNull().default(false),
  filterable: boolean("filterable").notNull().default(false),
  visible: boolean("visible").notNull().default(true),

  group: text("group_name"),

  defaultValue: jsonb("default_value").$type<FieldDefaultValue | null>(),
  options: jsonb("options").$type<FieldOption[] | null>(),
  validation: jsonb("validation").$type<FieldValidationMeta | null>(),
  relation: jsonb("relation").$type<FieldRelationMeta | null>(),

  placeholder: text("placeholder"),
  helpText: text("help_text"),

  sortOrder: integer("sort_order").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});