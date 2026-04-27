import { type AdminTableMeta } from "@ommr/shared";

export const EMPTY_GROUP_VALUE = "__empty_group__";

export function getTableGroupLabel(
  table: Pick<AdminTableMeta, "group" | "groupName">,
) {
  return table.groupName || table.group || "Без группы";
}
