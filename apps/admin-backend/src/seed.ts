import "dotenv/config";
import type {
  AdminTableStatus,
  CreateAdminFieldInput,
  FieldRelationMeta,
} from "@ommr/shared";
import { db } from "./db/index.js";
import { adminFields, adminTables } from "./db/schema.js";

type SeedField = Omit<CreateAdminFieldInput, "tableId">;

type SeedTable = {
  name: string;
  dbName: string;
  label: string;
  description?: string;
  icon: string;
  status: AdminTableStatus;
  sortOrder: number;
  fields: SeedField[];
};

const tables: SeedTable[] = [
  {
    name: "users",
    dbName: "users",
    label: "Пользователи",
    icon: "user",
    status: "needs_setup",
    sortOrder: 1,
    fields: [
      {
        name: "id",
        label: "ID",
        dbType: "int",
        inputType: "number",
        required: true,
        editable: false,
        sortable: true,
        filterable: true,
        visible: false,
      },
      {
        name: "full_name",
        label: "ФИО",
        dbType: "str",
        inputType: "text",
        required: true,
        sortable: true,
        filterable: true,
      },
      {
        name: "email",
        label: "Email",
        dbType: "str",
        inputType: "text",
        required: true,
        sortable: true,
        filterable: true,
      },
      {
        name: "role",
        label: "Роль",
        dbType: "str",
        inputType: "select",
        required: true,
        filterable: true,
      },
      {
        name: "created_at",
        label: "Создан",
        dbType: "datetime",
        inputType: "datetime",
        required: true,
        editable: false,
        sortable: true,
        filterable: true,
        visible: false,
      },
    ],
  },
  {
    name: "orders",
    dbName: "orders",
    label: "Заказы",
    description: "Краткое описание таблицы заказов",
    icon: "cart",
    status: "needs_setup",
    sortOrder: 2,
    fields: [
      {
        name: "id",
        label: "ID",
        dbType: "int",
        inputType: "number",
        required: true,
        editable: false,
        sortable: true,
        filterable: true,
        visible: false,
      },
      {
        name: "user_id",
        label: "Покупатель",
        dbType: "int",
        inputType: "select",
        required: true,
        editable: true,
        sortable: true,
        filterable: true,
        visible: true,
        placeholder: "Выберите покупателя...",
        helpText: "Укажите покупателя, оформившего заказ",
        relation: {
          targetTable: "users",
          targetKey: "id",
          displayField: "full_name",
        },
      },
      {
        name: "status",
        label: "Статус",
        dbType: "str",
        inputType: "select",
        required: true,
        editable: true,
        sortable: true,
        filterable: true,
      },
      {
        name: "total_amount",
        label: "Сумма",
        dbType: "decimal",
        inputType: "number",
        required: true,
        editable: true,
        sortable: true,
        filterable: true,
      },
      {
        name: "created_at",
        label: "Создан",
        dbType: "datetime",
        inputType: "datetime",
        required: true,
        editable: false,
        sortable: true,
        filterable: true,
        visible: false,
      },
    ],
  },
  {
    name: "products",
    dbName: "products",
    label: "Товары",
    icon: "box",
    status: "ready",
    sortOrder: 3,
    fields: [
      {
        name: "id",
        label: "ID",
        dbType: "int",
        inputType: "number",
        required: true,
        editable: false,
        sortable: true,
        filterable: true,
        visible: false,
      },
      {
        name: "name",
        label: "Название",
        dbType: "str",
        inputType: "text",
        required: true,
        sortable: true,
        filterable: true,
      },
      {
        name: "price",
        label: "Цена",
        dbType: "decimal",
        inputType: "number",
        required: true,
        sortable: true,
        filterable: true,
      },
      {
        name: "category_id",
        label: "Категория",
        dbType: "int",
        inputType: "select",
        required: true,
        filterable: true,
        relation: {
          targetTable: "categories",
          targetKey: "id",
          displayField: "name",
        },
      },
    ],
  },
  {
    name: "invoices",
    dbName: "invoices",
    label: "Счета",
    icon: "file",
    status: "draft",
    sortOrder: 4,
    fields: [
      {
        name: "id",
        label: "ID",
        dbType: "int",
        inputType: "number",
        required: true,
        editable: false,
        sortable: true,
        filterable: true,
        visible: false,
      },
      {
        name: "order_id",
        label: "Заказ",
        dbType: "int",
        inputType: "select",
        required: true,
        relation: {
          targetTable: "orders",
          targetKey: "id",
          displayField: "id",
        },
      },
      {
        name: "invoice_date",
        label: "Дата счета",
        dbType: "date",
        inputType: "date",
        required: true,
        sortable: true,
        filterable: true,
      },
    ],
  },
  {
    name: "categories",
    dbName: "categories",
    label: "Категории",
    icon: "tag",
    status: "needs_setup",
    sortOrder: 5,
    fields: [
      {
        name: "id",
        label: "ID",
        dbType: "int",
        inputType: "number",
        required: true,
        editable: false,
        sortable: true,
        filterable: true,
        visible: false,
      },
      {
        name: "name",
        label: "Название",
        dbType: "str",
        inputType: "text",
        required: true,
        sortable: true,
        filterable: true,
      },
    ],
  },
];

await db.delete(adminFields);
await db.delete(adminTables);

for (const table of tables) {
  const [createdTable] = await db
    .insert(adminTables)
    .values({
      name: table.name,
      dbName: table.dbName,
      label: table.label,
      description: table.description ?? null,
      icon: table.icon,
      status: table.status,
      source: "pydantic",
      sortOrder: table.sortOrder,
    })
    .returning();

  await db.insert(adminFields).values(
    table.fields.map((field, index) => ({
      tableId: createdTable.id,
      name: field.name,
      label: field.label,
      dbType: field.dbType,
      inputType: field.inputType,
      required: field.required ?? false,
      editable: field.editable ?? true,
      sortable: field.sortable ?? false,
      filterable: field.filterable ?? false,
      visible: field.visible ?? true,
      placeholder: field.placeholder ?? null,
      helpText: field.helpText ?? null,
      relation: field.relation ?? null,
      sortOrder: index + 1,
    })),
  );
}

console.log("[seed] Demo metadata created");
process.exit(0);
