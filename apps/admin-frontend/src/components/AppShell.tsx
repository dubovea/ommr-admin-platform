import type { PropsWithChildren } from "react";
import {
  Bell,
  Boxes,
  Database,
  LayoutDashboard,
  Link2,
  Search,
  Settings,
  Table2,
  Upload,
} from "lucide-react";
import { NavLink } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
const navItems = [
  { label: "Обзор", icon: LayoutDashboard, to: "/overview" },
  { label: "Таблицы", icon: Table2, to: "/tables" },
  { label: "Связи", icon: Link2, to: "/relations" },
  { label: "Схемы", icon: Boxes, to: "/schemas" },
  { label: "Настройки", icon: Settings, to: "/settings" },
];
export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr] bg-background">
      <aside className="flex flex-col gap-6 border-r bg-card px-4 py-6">
        <div className="flex items-center gap-3 px-2">
          <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
            <Database className="size-6" />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-semibold">Schema</div>
            <div className="text-xl font-semibold">Manager</div>
          </div>
        </div>
        <nav className="grid gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  (isActive || item.label === "Таблицы") &&
                    "bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700",
                )
              }
            >
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Card className="mt-auto flex-row items-center gap-3 p-3 shadow-none">
          <div className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
            <Database className="size-4" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Проект</div>
            <div className="text-sm font-semibold">E-Commerce</div>
          </div>
        </Card>
      </aside>
      <main className="min-w-0">
        <header className="flex h-20 items-center justify-between border-b bg-card px-7">
          <div className="relative w-[520px] max-w-[40vw]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 pl-9 pr-14"
              placeholder="Поиск по таблицам, схемам, полям..."
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              ⌘K
            </kbd>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Upload className="size-4" />
              Импортировать схему Pydantic
            </Button>
            <Button>+ Создать таблицу</Button>
            <Button variant="ghost" size="icon">
              <Bell className="size-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-violet-600 text-sm font-bold text-white">
                А
              </div>
              <div>
                <div className="text-sm font-semibold">Алексей П.</div>
                <div className="text-xs text-muted-foreground">
                  Администратор
                </div>
              </div>
            </div>
          </div>
        </header>
        <section className="p-7">{children}</section>
      </main>
    </div>
  );
}
