import { List } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
export function ListButton({
  children = "Список",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" {...props}>
      <List className="size-4" />
      {children}
    </Button>
  );
}
