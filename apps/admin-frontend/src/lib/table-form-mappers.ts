import type { CreateAdminTableInput, UpdateAdminTableInput } from "@ommr/shared";
import type { AdminTableFormValues } from "@ommr/shared/zod";

export function toCreateTablePayload(
  values: AdminTableFormValues,
): CreateAdminTableInput {
  return {
    name: values.name.trim(),
    label: values.label.trim(),
    description: values.description?.trim() || null,

    group: values.group ?? null,
    groupName: values.groupName ?? null,

    status: values.status,
    source: values.source,
    icon: values.icon || "table",

    showInMenu: values.showInMenu ?? true,
    canList: values.canList ?? true,
    canCreate: values.canCreate ?? true,
    canEdit: values.canEdit ?? true,
    canDelete: values.canDelete ?? true,
  };
}

export function toUpdateTablePayload(
  values: AdminTableFormValues,
): UpdateAdminTableInput {
  return {
    name: values.name.trim(),
    label: values.label.trim(),
    description: values.description?.trim() || null,

    group: values.group ?? null,
    groupName: values.groupName ?? null,

    status: values.status,
    icon: values.icon || "table",

    showInMenu: values.showInMenu ?? true,
    canList: values.canList ?? true,
    canCreate: values.canCreate ?? true,
    canEdit: values.canEdit ?? true,
    canDelete: values.canDelete ?? true,
  };
}
