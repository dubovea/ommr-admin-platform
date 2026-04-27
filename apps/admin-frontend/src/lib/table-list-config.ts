import {
  ADMIN_TABLE_SOURCE_LABELS,
  ADMIN_TABLE_SOURCES,
  ADMIN_TABLE_STATUS_LABELS,
  ADMIN_TABLE_STATUSES,
  type AdminTableSource,
  type AdminTableStatus,
} from "@ommr/shared";

export const SOURCE_FILTER_OPTIONS = ADMIN_TABLE_SOURCES.map((source) => ({
  label: ADMIN_TABLE_SOURCE_LABELS[source],
  value: source,
}));

export const STATUS_FILTER_OPTIONS = ADMIN_TABLE_STATUSES.map((status) => ({
  label: ADMIN_TABLE_STATUS_LABELS[status],
  value: status,
}));

export function getSourceBadgeClassName(source: AdminTableSource) {
  switch (source) {
    case "pydantic":
      return "bg-violet-100 text-violet-700";
    case "manual":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function getStatusDotClassName(status: AdminTableStatus) {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-700";
    case "needs_setup":
      return "bg-amber-100 text-amber-700";
    case "partial":
      return "bg-blue-100 text-blue-700";
    case "ready":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}
