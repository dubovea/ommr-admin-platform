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
];
export const FIELD_INPUT_TYPE_LABELS = {
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
];
export const ADMIN_TABLE_STATUS_LABELS = {
    draft: "Черновик",
    needs_setup: "Нужно настроить",
    ready: "Готово",
    partial: "Частично",
};
export const ADMIN_TABLE_SOURCES = ["pydantic", "manual"];
export const ADMIN_TABLE_SOURCE_LABELS = {
    pydantic: "Pydantic",
    manual: "Ручной",
};
export const ADMIN_TABLE_GROUPS = ["master_tables", "detail_tables"];
export const ADMIN_TABLE_GROUP_LABELS = {
    master_tables: "Мастер-таблицы",
    detail_tables: "Детальные таблицы",
};
export const ADMIN_TABLE_GROUP_OPTIONS = ADMIN_TABLE_GROUPS.map((group) => ({
    id: group,
    label: ADMIN_TABLE_GROUP_LABELS[group],
}));
export const DEFAULT_FIELD_VALIDATION = {
    min: null,
    max: null,
    minLength: null,
    maxLength: null,
    pattern: null,
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
