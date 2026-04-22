import { ADMIN_TABLE_STATUS_LABELS, type AdminTableStatus } from "@ommr/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
export function StatusBadge({ status }: { status: AdminTableStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold",
        status === "needs_setup" &&
          "border-orange-200 bg-orange-50 text-orange-700",
        status === "ready" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "draft" && "border-blue-200 bg-blue-50 text-blue-700",
        status === "partial" && "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {ADMIN_TABLE_STATUS_LABELS[status]}
    </Badge>
  );
}
