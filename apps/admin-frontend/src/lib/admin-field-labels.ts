export const ADMIN_TABLE_LABELS: Record<string, string> = {
  users: "Пользователи",
  products: "Товары",
  categories: "Категории",
};

export const ADMIN_DISPLAY_FIELD_LABELS: Record<string, string> = {
  full_name: "ФИО",
  name: "Название",
  title: "Заголовок",
};

export function getAdminTableLabel(value: string) {
  return ADMIN_TABLE_LABELS[value] ?? value;
}

export function getAdminDisplayFieldLabel(value: string) {
  return ADMIN_DISPLAY_FIELD_LABELS[value] ?? value;
}
