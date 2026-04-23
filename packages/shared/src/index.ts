export const FIELD_INPUT_TYPES = [
  "text",
  "textarea",
  "number",
  "checkbox",
  "switch",
  "date",
  "time",
  "datetime",
  "select",
  "multiselect",
] as const;

export type FieldInputType = (typeof FIELD_INPUT_TYPES)[number];

export const FIELD_INPUT_TYPE_LABELS: Record<FieldInputType, string> = {
  text: "Текст",
  textarea: "Многострочный текст",
  number: "Числовой ввод",
  checkbox: "Флажок",
  switch: "Переключатель",
  date: "Дата",
  time: "Время",
  datetime: "Дата и время",
  select: "Выпадающий список (одиночный выбор)",
  multiselect: "Выпадающий список (множественный выбор)",
};

export const ADMIN_TABLE_STATUSES = [
  "draft",
  "needs_setup",
  "ready",
  "partial",
] as const;

export type AdminTableStatus = (typeof ADMIN_TABLE_STATUSES)[number];

export const ADMIN_TABLE_STATUS_LABELS: Record<AdminTableStatus, string> = {
  draft: "Черновик",
  needs_setup: "Нужно настроить",
  ready: "Готово",
  partial: "Частично",
};

export const ADMIN_TABLE_SOURCES = ["pydantic", "manual"] as const;

export type AdminTableSource = (typeof ADMIN_TABLE_SOURCES)[number];

export type FieldOption = {
  label: string;
  value: string;
};

export type FieldValidationMeta = {
  min: number | null;
  max: number | null;
  minLength: number | null;
  maxLength: number | null;
  pattern: string | null;
};

export const DEFAULT_FIELD_VALIDATION: FieldValidationMeta = {
  min: null,
  max: null,
  minLength: null,
  maxLength: null,
  pattern: null,
};

export type FieldRelationMeta = {
  targetTable: string;
  targetKey: string;
  displayField: string;
  additionalText?: string | null;
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
  | "visible";

export type FieldDefaultValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | Record<string, unknown>;

export type AdminFieldMeta = {
  id: string;
  tableId: string;
  name: string;
  label: string;
  dbType?: string;
  inputType: FieldInputType;
  required: boolean;
  editable: boolean;
  sortable: boolean;
  filterable: boolean;
  visible: boolean;
  group?: string | null;
  defaultValue?: FieldDefaultValue;
  options?: FieldOption[] | null;
  validation?: FieldValidationMeta | null;
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

export type CreateAdminTableInput = Pick<AdminTableMeta, "name" | "label"> &
  Partial<Pick<AdminTableMeta, "description" | "status" | "source" | "icon">>;

export type UpdateAdminTableInput = Partial<
  Pick<
    AdminTableMeta,
    | "name"
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
      | "visible"
      | "group"
      | "defaultValue"
      | "options"
      | "validation"
      | "placeholder"
      | "helpText"
      | "relation"
      | "sortOrder"
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
    | "visible"
    | "group"
    | "defaultValue"
    | "options"
    | "validation"
    | "placeholder"
    | "helpText"
    | "relation"
    | "sortOrder"
  >
>;
