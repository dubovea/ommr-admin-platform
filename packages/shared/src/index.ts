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

export type AdminTableStatus = "draft" | "needs_setup" | "ready" | "partial";

export const ADMIN_TABLE_STATUS_LABELS: Record<AdminTableStatus, string> = {
  draft: "Черновик",
  needs_setup: "Нужно настроить",
  ready: "Готово",
  partial: "Частично"
};

export type RelationType =
  | "many-to-one"
  | "one-to-many"
  | "one-to-one"
  | "many-to-many";

export type FieldRelationMeta = {
  targetTable: string;
  relationType: RelationType;
  displayField: string;
};

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
  createdAt?: string;
  updatedAt?: string;
};

export type AdminTableMeta = {
  id: string;
  name: string;
  dbName: string;
  label: string;
  description?: string | null;
  status: AdminTableStatus;
  source: "pydantic" | "manual";
  canList: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  icon?: string | null;
  fieldsCount?: number;
  relationsCount?: number;
  requiredFieldsCount?: number;
  fields?: AdminFieldMeta[];
  createdAt?: string;
  updatedAt?: string;
};
