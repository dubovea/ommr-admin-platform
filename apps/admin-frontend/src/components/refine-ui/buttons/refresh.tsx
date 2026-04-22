import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
export function RefreshButton({
  children = "Обновить",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" {...props}>
      <RefreshCw className="size-4" />
      {children}
    </Button>
  );
}
