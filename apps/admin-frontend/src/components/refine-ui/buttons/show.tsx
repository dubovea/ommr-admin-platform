import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
export function ShowButton({
  children = "Просмотр",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" {...props}>
      <Eye className="size-4" />
      {children}
    </Button>
  );
}
