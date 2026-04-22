import { Button } from "@/components/ui/button";
export function UndoableNotification({
  message,
  onUndo,
}: {
  message: string;
  onUndo?: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span>{message}</span>
      {onUndo ? (
        <Button size="sm" variant="outline" onClick={onUndo}>
          Отменить
        </Button>
      ) : null}
    </div>
  );
}
