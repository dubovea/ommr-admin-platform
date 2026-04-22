export const FIELD_INPUT_TYPES = [
  "text",
  "number",
  "date",
  "time",
  "datetime",
  "select",
  "multiselect"
] as const;

export type FieldInputType = (typeof FIELD_INPUT_TYPES)[number];

export const FIELD_INPUT_TYPE_LABELS: Record<FieldInputType, string> = {
  text: "Текст",
  number: "Числовой ввод",
  date: "Дата",
  time: "Время",
  datetime: "Дата и время",
  select: "Выпадающий список (одиночный выбор)",
  multiselect: "Выпадающий список (мульти выбор)"
};

export const ADMIN_TABLE_STATUSES = [
  "draft",
  "needs_setup",
  "ready",
  "partial"
] as const;

export type AdminTableStatus = (typeof ADMIN_TABLE_STATUSES)[number];

export const ADMIN_TABLE_STATUS_LABELS: Record<AdminTableStatus, string> = {
  draft: "Черновик",
  needs_setup: "Нужно настроить",
  ready: "Готово",
  partial: "Частично"
};

export const ADMIN_TABLE_SOURCES = ["pydantic", "manual"] as const;

export type AdminTableSource = (typeof ADMIN_TABLE_SOURCES)[number];

export const RELATION_TYPES = [
  "many-to-one",
  "one-to-many",
  "one-to-one",
  "many-to-many"
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

export type FieldRelationMeta = {
  targetTable: string;
  relationType: RelationType;
  displayField: string;
};

export type AdminTableActionKey =
  | "canList"
  | "canCreate"
  | "canEdit"
  | "canDelete";

export type AdminFieldFlagKey =
  | "required"
  | "editable"
  | "sortable"
  | "filterable"
  | "showInList"
  | "showInForm";

export type AdminFieldMeta = {
  id: string;
  tableId: string;
  name: string;
  label: string;
  dbType: string;
  inputType: FieldInputType;
  required: boolean;
  editable: boolean;
  sortable: boolean;
  filterable: boolean;
  showInList: boolean;
  showInForm: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  relation?: FieldRelationMeta | null;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminTableMeta = {
  id: string;
  name: string;
  dbName: string;
  label: string;
  description?: string | null;
  icon?: string | null;
  status: AdminTableStatus;
  source: AdminTableSource;
  canList: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  sortOrder?: number;
  fieldsCount?: number;
  relationsCount?: number;
  requiredFieldsCount?: number;
  fields?: AdminFieldMeta[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAdminTableInput = Pick<
  AdminTableMeta,
  "name" | "dbName" | "label"
> &
  Partial<
    Pick<AdminTableMeta, "description" | "status" | "source" | "icon">
  >;

export type UpdateAdminTableInput = Partial<
  Pick<
    AdminTableMeta,
    | "name"
    | "dbName"
    | "label"
    | "description"
    | "status"
    | "icon"
    | "canList"
    | "canCreate"
    | "canEdit"
    | "canDelete"
  >
>;

export type CreateAdminFieldInput = Pick<
  AdminFieldMeta,
  "tableId" | "name" | "label" | "dbType" | "inputType"
> &
  Partial<
    Pick<
      AdminFieldMeta,
      | "required"
      | "editable"
      | "sortable"
      | "filterable"
      | "showInList"
      | "showInForm"
    >
  >;

export type UpdateAdminFieldInput = Partial<
  Pick<
    AdminFieldMeta,
    | "label"
    | "dbType"
    | "inputType"
    | "required"
    | "editable"
    | "sortable"
    | "filterable"
    | "showInList"
    | "showInForm"
    | "placeholder"
    | "helpText"
    | "relation"
  >
>;
