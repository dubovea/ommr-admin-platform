import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeleteItemsToolbar({
  selectedCount,
  disabled = false,
  deleteDisabled,
  onDeleteClick,
  label = "Выбрано",
}: {
  selectedCount: number;
  disabled?: boolean;
  deleteDisabled?: boolean;
  onDeleteClick: () => void;
  label?: string;
}) {
  const hasSelection = selectedCount > 0;
  const isDeleteDisabled = deleteDisabled ?? (disabled || !hasSelection);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div
        className={cn(
          "flex h-9 items-center rounded-md border bg-background px-3 text-sm text-muted-foreground",
          hasSelection && "border-destructive/30 bg-destructive/5 text-foreground",
        )}
      >
        {label}:&nbsp;
        <span className="font-semibold text-foreground">{selectedCount}</span>
      </div>

      <Button
        type="button"
        variant={hasSelection ? "destructive" : "outline"}
        size="sm"
        disabled={isDeleteDisabled}
        onClick={onDeleteClick}
        className="min-w-28"
      >
        <Trash2 className="size-4" />
        Удалить
      </Button>
    </div>
  );
}
