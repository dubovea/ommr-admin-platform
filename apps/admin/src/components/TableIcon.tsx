import { Box, FileText, ShoppingCart, Tag, User, Table2 } from "lucide-react";

const iconMap = {
  user: User,
  cart: ShoppingCart,
  box: Box,
  file: FileText,
  tag: Tag,
  table: Table2
};

type IconName = keyof typeof iconMap;

export function TableIcon({ icon }: { icon?: string | null }) {
  const Icon = iconMap[(icon ?? "table") as IconName] ?? Table2;

  return (
    <div className={`table-icon table-icon-${icon ?? "table"}`}>
      <Icon size={18} />
    </div>
  );
}
