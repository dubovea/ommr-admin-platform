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
    label: "Пользователи",
    icon: "user",
    status: "needs_setup",
    sortOrder: 1,
    fields: [
      {
        name: "id",
        label: "ID",
        dbType: "int",
        inputType: "integer",
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
        inputType: "integer",
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
        inputType: "float",
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
    label: "Товары",
    icon: "box",
    status: "ready",
    sortOrder: 3,
    fields: [
      {
        name: "id",
        label: "ID",
        dbType: "int",
        inputType: "integer",
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
        inputType: "float",
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
    label: "Счета",
    icon: "file",
    status: "draft",
    sortOrder: 4,
    fields: [
      {
        name: "id",
        label: "ID",
        dbType: "int",
        inputType: "integer",
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
    label: "Категории",
    icon: "tag",
    status: "needs_setup",
    sortOrder: 5,
    fields: [
      {
        name: "id",
        label: "ID",
        dbType: "int",
        inputType: "integer",
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

const tableIdByName = new Map<string, string>();

for (const table of tables) {
  const [createdTable] = await db
    .insert(adminTables)
    .values({
      name: table.name,
      label: table.label,
      description: table.description ?? null,
      icon: table.icon,
      status: table.status,
      source: "pydantic",
      sortOrder: table.sortOrder,
    })
    .returning();

  tableIdByName.set(table.name, createdTable.id);
}

for (const table of tables) {
  const tableId = tableIdByName.get(table.name);

  if (!tableId) {
    continue;
  }

  const values = table.fields.map((field, index) => {
    const targetTableName = field.relation?.targetTable ?? null;
    const targetTableId = targetTableName
      ? tableIdByName.get(targetTableName) ?? null
      : null;

    const relation: FieldRelationMeta | null =
      field.relation && targetTableId
        ? {
            targetTableId,
            targetTable: field.relation.targetTable ?? targetTableName ?? "",
            targetKey: field.relation.targetKey ?? "id",
            displayField: field.relation.displayField ?? "name",
            additionalText: field.relation.additionalText ?? null,
          }
        : null;

    return {
      tableId,
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
      relation,
      relationTargetTableId: targetTableId,
      sortOrder: index + 1,
    };
  });

  if (values.length > 0) {
    await db.insert(adminFields).values(values);
  }
}

console.log("[seed] Demo metadata created");
process.exit(0);
