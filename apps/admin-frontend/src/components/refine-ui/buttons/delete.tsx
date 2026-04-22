import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
export function DeleteButton({
  children = "Удалить",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" {...props}>
      <Trash2 className="size-4" />
      {children}
    </Button>
  );
}
