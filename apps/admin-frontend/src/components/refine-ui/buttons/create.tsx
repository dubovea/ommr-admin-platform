import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
export function CreateButton({
  children = "Создать",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" {...props}>
      <Plus className="size-4" />
      {children}
    </Button>
  );
}
