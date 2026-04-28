import { ReactNode } from "react";
import { Label } from "@/components/ui/label";

type LabelWithFieldProps = {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function LabelWithField({
  label,
  required,
  children,
  className,
}: LabelWithFieldProps) {
  return (
    <div className={`flex items-start gap-3 w-full ${className || ""}`}>
      <Label className="w-45 text-sm font-medium text-muted-foreground pt-2 shrink-0">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}