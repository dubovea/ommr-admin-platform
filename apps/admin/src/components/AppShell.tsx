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
  Upload
} from "lucide-react";
import { NavLink } from "react-router";

const navItems = [
  { label: "Обзор", icon: LayoutDashboard, to: "/overview" },
  { label: "Таблицы", icon: Table2, to: "/tables" },
  { label: "Связи", icon: Link2, to: "/relations" },
  { label: "Схемы", icon: Boxes, to: "/schemas" },
  { label: "Настройки", icon: Settings, to: "/settings" }
];

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Database size={24} />
          </div>
          <div>
            <strong>Schema</strong>
            <strong>Manager</strong>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive || item.label === "Таблицы" ? "sidebar-link-active" : ""}`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="project-card">
          <div className="project-icon">
            <Database size={18} />
          </div>
          <div>
            <span>Проект</span>
            <strong>E-Commerce</strong>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-search">
            <Search size={18} />
            <input placeholder="Поиск по таблицам, схемам, полям..." />
            <kbd>⌘K</kbd>
          </div>

          <div className="topbar-actions">
            <button className="button button-ghost">
              <Upload size={18} />
              Импортировать схему Pydantic
            </button>
            <button className="button button-primary">+ Создать таблицу</button>
            <button className="icon-button">
              <Bell size={20} />
            </button>
            <div className="user-profile">
              <div className="avatar">А</div>
              <div>
                <strong>Алексей П.</strong>
                <span>Администратор</span>
              </div>
            </div>
          </div>
        </header>

        <section className="content">{children}</section>
      </main>
    </div>
  );
}
