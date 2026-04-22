import type { ReactNode } from "react";
import { Save } from "lucide-react";
import { useNavigation } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
export function EditView({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-5", className)}>{children}</div>;
}
export function EditViewHeader({
  title,
  resource = "tables",
  onSave,
  saving = false,
  className,
}: {
  title: string;
  resource?: string;
  onSave?: () => void;
  saving?: boolean;
  className?: string;
}) {
  const { list } = useNavigation();
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <div className="mb-2 text-sm text-muted-foreground">
          Таблицы / Редактирование таблицы
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <Badge
            className="border-orange-200 bg-orange-50 text-orange-700"
            variant="outline"
          >
            Черновик
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => list(resource)}>
          Назад
        </Button>
        {onSave ? (
          <Button onClick={onSave} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
