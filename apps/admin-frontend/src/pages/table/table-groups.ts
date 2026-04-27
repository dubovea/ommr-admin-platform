import { ADMIN_TABLE_GROUP_OPTIONS, type AdminTableMeta } from "@ommr/shared";

export const TABLE_GROUP_OPTIONS = ADMIN_TABLE_GROUP_OPTIONS;
export const EMPTY_GROUP_VALUE = "__empty_group__";

export function getTableGroupLabel(table: Pick<AdminTableMeta, "group" | "groupName">) {
  return table.groupName || table.group || "Без группы";
}
