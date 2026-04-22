import { Box, FileText, ShoppingCart, Tag, Table2, User } from "lucide-react";
import { cn } from "@/lib/utils";
const iconMap = {
  user: User,
  cart: ShoppingCart,
  box: Box,
  file: FileText,
  tag: Tag,
  table: Table2,
};
type IconName = keyof typeof iconMap;
export function TableIcon({ icon }: { icon?: string | null }) {
  const Icon = iconMap[(icon ?? "table") as IconName] ?? Table2;
  return (
    <div
      className={cn(
        "grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600",
        icon === "cart" && "bg-violet-50 text-violet-600",
        icon === "box" && "bg-emerald-50 text-emerald-600",
        icon === "file" && "bg-orange-50 text-orange-600",
        icon === "tag" && "bg-purple-50 text-purple-600",
      )}
    >
      <Icon className="size-5" />
    </div>
  );
}
