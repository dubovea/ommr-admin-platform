import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
export function CloneButton({
  children = "Клонировать",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" {...props}>
      <Copy className="size-4" />
      {children}
    </Button>
  );
}
