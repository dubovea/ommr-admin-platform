import { Boxes, Database, LayoutDashboard, Link2, Table2 } from "lucide-react";
import { NavLink } from "react-router";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
const nav = [
  ["Обзор", LayoutDashboard, "/overview"],
  ["Таблицы", Table2, "/tables"],
  ["Связи", Link2, "/relations"],
  ["Схемы", Boxes, "/schemas"],
] as const;
export function Sidebar() {
  return (
    <aside className="flex flex-col gap-6 border-r bg-card px-4 py-6">
      <div className="flex items-center gap-3 px-2">
        <Database className="size-8 text-blue-600" />
        <div className="leading-tight">
          <div className="text-xl font-semibold">PySchema</div>
          <div className="text-xl font-semibold">Manager</div>
        </div>
      </div>
      <nav className="grid gap-1">
        {nav.map(([label, Icon, to]) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                isActive &&
                  "bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700",
              )
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <Card className="mt-auto flex-row items-center gap-3 p-3 shadow-none">
        <Database className="size-4 text-blue-600" />
        <div>
          <div className="text-xs text-muted-foreground">Проект</div>
          <div className="text-sm font-semibold">OMMR</div>
        </div>
      </Card>
    </aside>
  );
}
