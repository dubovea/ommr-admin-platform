import {
  boolean,
  index,
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

export const adminTables = pgTable("admin_tables", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull(),
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

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const adminFields = pgTable(
  "admin_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    tableId: uuid("table_id")
      .notNull()
      .references(() => adminTables.id, { onDelete: "cascade" }),

    relationTargetTableId: uuid("relation_target_table_id").references(
      () => adminTables.id,
      { onDelete: "set null" },
    ),

    relation: jsonb("relation").$type<FieldRelationMeta | null>(),

    name: text("name").notNull(),
    label: text("label").notNull(),
    dbType: text("db_type"),

    inputType: fieldInputTypeEnum("input_type").notNull(),

    visible: boolean("visible").notNull().default(true),
    required: boolean("required").notNull().default(false),
    editable: boolean("editable").notNull().default(true),
    sortable: boolean("sortable").notNull().default(false),
    filterable: boolean("filterable").notNull().default(false),

    group: text("group_name"),

    defaultValue: jsonb("default_value").$type<FieldDefaultValue | null>(),
    options: jsonb("options").$type<FieldOption[] | null>(),
    validation: jsonb("validation").$type<FieldValidationMeta | null>(),

    placeholder: text("placeholder"),
    helpText: text("help_text"),

    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("admin_fields_table_id_idx").on(table.tableId),
    index("admin_fields_relation_target_table_id_idx").on(
      table.relationTargetTableId,
    ),
  ],
);

export type AdminTableRow = typeof adminTables.$inferSelect;
export type NewAdminTableRow = typeof adminTables.$inferInsert;

export type AdminFieldRow = typeof adminFields.$inferSelect;
export type NewAdminFieldRow = typeof adminFields.$inferInsert;