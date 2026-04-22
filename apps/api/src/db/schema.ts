import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";

export const tableStatusEnum = pgEnum("table_status", [
  "draft",
  "needs_setup",
  "ready",
  "partial"
]);

export const tableSourceEnum = pgEnum("table_source", ["pydantic", "manual"]);

export const fieldInputTypeEnum = pgEnum("field_input_type", [
  "text",
  "number",
  "date",
  "time",
  "datetime",
  "select",
  "multiselect"
]);

export const adminTables = pgTable("admin_tables", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull(),
  dbName: text("db_name").notNull(),
  label: text("label").notNull(),
  description: text("description"),

  icon: text("icon").default("table"),
  status: tableStatusEnum("status").notNull().default("needs_setup"),
  source: tableSourceEnum("source").notNull().default("pydantic"),

  canList: boolean("can_list").notNull().default(true),
  canCreate: boolean("can_create").notNull().default(true),
  canEdit: boolean("can_edit").notNull().default(true),
  canDelete: boolean("can_delete").notNull().default(true),

  sortOrder: integer("sort_order").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const adminFields = pgTable("admin_fields", {
  id: uuid("id").primaryKey().defaultRandom(),

  tableId: uuid("table_id")
    .notNull()
    .references(() => adminTables.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  label: text("label").notNull(),
  dbType: text("db_type").notNull(),

  inputType: fieldInputTypeEnum("input_type").notNull(),

  required: boolean("required").notNull().default(false),
  editable: boolean("editable").notNull().default(true),
  sortable: boolean("sortable").notNull().default(false),
  filterable: boolean("filterable").notNull().default(false),

  showInList: boolean("show_in_list").notNull().default(true),
  showInForm: boolean("show_in_form").notNull().default(true),

  placeholder: text("placeholder"),
  helpText: text("help_text"),

  relation: jsonb("relation").$type<{
    targetTable: string;
    relationType: "many-to-one" | "one-to-many" | "one-to-one" | "many-to-many";
    displayField: string;
  } | null>(),

  sortOrder: integer("sort_order").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
