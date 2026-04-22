import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type DeleteItemsDialogItem = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
};

export function DeleteItemsDialog({
  open,
  onOpenChange,
  title,
  description,
  items = [],
  itemsTitle = "Будут удалены:",
  confirmText = "Да",
  cancelText = "Отмена",
  pendingText = "Удаление...",
  isPending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  items?: ConfirmDeleteDialogItem[];
  itemsTitle?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  pendingText?: string;
  isPending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {items.length > 0 && (
          <div className="max-h-48 overflow-auto rounded-md border bg-muted/30 p-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              {itemsTitle}
            </div>

            <ul className="space-y-1 text-sm">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="truncate font-medium">{item.title}</span>

                  {item.description ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {cancelText}
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-white hover:bg-destructive/90 focus:ring-destructive/30"
          >
            {isPending ? pendingText : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
