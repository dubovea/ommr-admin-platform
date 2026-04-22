import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
export function EditButton({
  children = "Редактировать",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" {...props}>
      <Pencil className="size-4" />
      {children}
    </Button>
  );
}
