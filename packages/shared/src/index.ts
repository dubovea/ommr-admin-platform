export type AdminApiPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminApiListResponse<T = unknown> = {
  data?: T[];
  total?: number;
  pagination?: AdminApiPagination;
};

export type AdminApiOneResponse<T = unknown> = {
  data?: T;
};

export const FIELD_INPUT_TYPES = [
  "text",
  "textarea",
  "integer",
  "float",
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
  integer: "Целое число",
  float: "Дробное число (с запятой)",
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

export const ADMIN_TABLE_SOURCE_LABELS: Record<AdminTableSource, string> = {
  pydantic: "Pydantic",
  manual: "Ручной",
};

export const ADMIN_TABLE_GROUPS = ["master_tables", "detail_tables"] as const;

export type AdminTableGroup = (typeof ADMIN_TABLE_GROUPS)[number];

export const ADMIN_TABLE_GROUP_LABELS: Record<AdminTableGroup, string> = {
  master_tables: "Мастер-таблицы",
  detail_tables: "Детальные таблицы",
};

export const ADMIN_TABLE_GROUP_OPTIONS = ADMIN_TABLE_GROUPS.map((group) => ({
  id: group,
  label: ADMIN_TABLE_GROUP_LABELS[group],
}));

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

/**
 * Полная relation-модель, которая хранится в БД после нормализации backend-ом.
 */
export type FieldRelationMeta = {
  targetTableId: string;
  targetTable: string;
  targetKey: string;
  displayField: string;
  additionalText?: string | null;
};

/**
 * Входной relation-payload от frontend/API.
 *
 * Frontend может отправить только targetTableId,
 * а backend сам достроит targetTable, targetKey и displayField.
 */
export type FieldRelationInput = {
  targetTableId?: string | null;
  targetTable?: string | null;
  targetKey?: string | null;
  displayField?: string | null;
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

  /**
   * Зеркальная FK-колонка для PostgreSQL.
   * Основной UI-конфиг лежит в relation.
   */
  relationTargetTableId?: string | null;

  name: string;
  label: string;
  dbType?: string | null;
  inputType: FieldInputType;

  required: boolean;
  editable: boolean;
  sortable: boolean;
  filterable: boolean;
  visible: boolean;

  group?: string | null;
  defaultValue?: FieldDefaultValue | null;
  options?: FieldOption[] | null;
  validation?: FieldValidationMeta | null;
  placeholder?: string | null;
  helpText?: string | null;

  /**
   * Полная relation-модель, уже нормализованная backend-ом.
   */
  relation?: FieldRelationMeta | null;

  sortOrder?: number;

  createdAt?: string;
  updatedAt?: string;
};

export type AdminTableMeta = {
  id: string;
  name: string;
  group: string | null;
  groupName: string | null;

  label: string;
  description?: string | null;
  icon?: string | null;
  status: AdminTableStatus;
  source: AdminTableSource;

  showInMenu: boolean;
  canList: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;

  sortOrder?: number;

  fieldsCount?: number;
  relationsCount?: number;
  requiredFieldsCount?: number;

  /**
   * Присутствует только когда backend возвращает таблицы с includeFields=true
   * или при детальном запросе таблицы.
   */
  fields?: AdminFieldMeta[];

  createdAt?: string;
  updatedAt?: string;
};

export type CreateAdminTableInput = Pick<AdminTableMeta, "name" | "label"> &
  Partial<
    Pick<
      AdminTableMeta,
      | "group"
      | "groupName"
      | "description"
      | "status"
      | "source"
      | "icon"
      | "showInMenu"
      | "canList"
      | "canCreate"
      | "canEdit"
      | "canDelete"
    >
  >;

export type UpdateAdminTableInput = Partial<
  Pick<
    AdminTableMeta,
    | "name"
    | "group"
    | "groupName"
    | "label"
    | "description"
    | "status"
    | "icon"
    | "showInMenu"
    | "canList"
    | "canCreate"
    | "canEdit"
    | "canDelete"
  >
>;

type CreateAdminFieldInputBase = Pick<
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
      | "sortOrder"
    >
  >;

type UpdateAdminFieldInputBase = Partial<
  Pick<
    AdminFieldMeta,
    | "name"
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
    | "sortOrder"
  >
>;

/**
 * DTO для создания поля.
 *
 * relation принимает ослабленный FieldRelationInput,
 * потому что frontend может отправить только targetTableId.
 */
export type CreateAdminFieldInput = CreateAdminFieldInputBase & {
  relation?: FieldRelationInput | null;
};

/**
 * DTO для обновления поля.
 *
 * relation принимает ослабленный FieldRelationInput,
 * потому что backend сам достраивает недостающие части relation.
 */
export type UpdateAdminFieldInput = UpdateAdminFieldInputBase & {
  relation?: FieldRelationInput | null;
};

/**
 * Payload, который уже подготовлен backend-ом для insert в admin_fields.
 */
export type NormalizedCreateAdminFieldPayload = Omit<
  CreateAdminFieldInput,
  "relation"
> & {
  relation: FieldRelationMeta | null;
  relationTargetTableId: string | null;
};

/**
 * Payload, который уже подготовлен backend-ом для update admin_fields.
 */
export type NormalizedUpdateAdminFieldPayload = Omit<
  UpdateAdminFieldInput,
  "relation"
> & {
  relation?: FieldRelationMeta | null;
  relationTargetTableId?: string | null;
};

export type MetadataExportRelation = Omit<
  FieldRelationMeta,
  "targetTableId"
> | null;

export type MetadataExportField = Pick<
  AdminFieldMeta,
  "name" | "label" | "inputType" | "visible" | "editable" | "required"
> & {
  relation: MetadataExportRelation;
};

export type MetadataExportTable = Pick<AdminTableMeta, "name" | "label"> &
  Partial<Pick<AdminTableMeta, "group" | "groupName" | "showInMenu">> & {
    fields: MetadataExportField[];
  };

export type MetadataExportMenuItem = {
  id: string;
  label: string;
};

export type MetadataExportMenuGroup = {
  id: string;
  label: string;
  elements: MetadataExportMenuItem[];
};

export type MetadataExport = {
  tables: MetadataExportTable[];
  menu: MetadataExportMenuGroup[];
};

export const SIDEBAR_ITEMS = [
  {
    id: "master_tables",
    label: "Мастер-таблицы",
    elements: [
      { id: "cargoes", label: "Грузы" },
      { id: "tracks", label: "Пути" },
      { id: "tracks_links", label: "ПутиСвязи" },
      { id: "locos", label: "Локомотивы" },
      { id: "locos_manevours", label: "МаневровыеРайоны" },
      { id: "load_racks", label: "Эстакады" },
      { id: "load_rack_variants", label: "ЭстадыВарианты" },
      { id: "wagon_types", label: "ТипыВагонов" },
      { id: "operation_time", label: "ВремяОпераций" },
    ],
  },
  {
    id: "detail_tables",
    label: "Детальные таблицы",
    elements: [
      { id: "shipments", label: "Отгрузка" },
      { id: "locos_inits", label: "ЛокомотивыНачало" },
      { id: "wagons_inits", label: "ВагоныНачало" },
      { id: "wagons_arrival", label: "ВагоныПоступление" },
      { id: "locos_intransit", label: "ЛокомотивыВПути" },
      { id: "load_racks_process", label: "ЭстакадыНалив" },
      { id: "resource_unavailable", label: "РесурсНедоступность" },
      { id: "locos_shift_change", label: "ЛокомотивыСмена" },
    ],
  },
];
