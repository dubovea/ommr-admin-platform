import {
  ADMIN_TABLE_STATUS_LABELS,
  type AdminTableStatus
} from "@ommr/shared";

export function StatusBadge({ status }: { status: AdminTableStatus }) {
  return (
    <span className={`status-badge status-${status}`}>
      {ADMIN_TABLE_STATUS_LABELS[status]}
    </span>
  );
}
