import { useEffect, useMemo, useState } from "react";
import { Eye, MoreHorizontal, Pencil, Search } from "lucide-react";
import type { AdminTableMeta } from "@ommr/shared";
import { getTables } from "../api/adminApi";
import { StatusBadge } from "../components/StatusBadge";
import { TableIcon } from "../components/TableIcon";
import { Link } from "react-router";

export function TablesPage() {
  const [tables, setTables] = useState<AdminTableMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getTables().then((items) => {
      setTables(items);
      setSelectedId((current) => current ?? items.find((item) => item.name === "orders")?.id ?? items[0]?.id ?? null);
    });
  }, []);

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const value = query.trim().toLowerCase();

      if (!value) return true;

      return (
        table.name.toLowerCase().includes(value) ||
        table.label.toLowerCase().includes(value)
      );
    });
  }, [query, tables]);

  const selected = tables.find((table) => table.id === selectedId) ?? tables[0];

  return (
    <div className="page-grid">
      <section className="workspace">
        <div className="page-header">
          <h1>Таблицы</h1>
        </div>

        <div className="info-banner">
          <div className="info-icon">i</div>
          <div>
            <strong>Импортированы базовые свойства из Pydantic</strong>
            <p>Мы импортировали только базовые свойства: имена, поля и типы. Остальные настройки задаются в интерфейсе.</p>
          </div>
        </div>

        <div className="toolbar">
          <div className="toolbar-search">
            <Search size={18} />
            <input
              placeholder="Поиск по названию таблицы..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <select>
            <option>Статус: Все</option>
            <option>Нужно настроить</option>
            <option>Готово</option>
          </select>

          <select>
            <option>Сортировка: По названию</option>
            <option>Сортировка: По обновлению</option>
          </select>
        </div>

        <div className="card data-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Таблица</th>
                <th>Название</th>
                <th>Поля</th>
                <th>Связи</th>
                <th>Статус</th>
                <th>Источник</th>
                <th>Обновлено</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredTables.map((table) => (
                <tr
                  key={table.id}
                  className={table.id === selected?.id ? "selected-row" : ""}
                  onClick={() => setSelectedId(table.id)}
                >
                  <td>
                    <div className="entity-cell">
                      <TableIcon icon={table.icon} />
                      <strong>{table.name}</strong>
                    </div>
                  </td>
                  <td>{table.label}</td>
                  <td>{table.fieldsCount ?? 0}</td>
                  <td>{table.relationsCount ?? 0}</td>
                  <td>
                    <StatusBadge status={table.status} />
                  </td>
                  <td>
                    <span className="source-pill">P</span> Pydantic
                  </td>
                  <td>Сегодня</td>
                  <td>
                    <div className="row-actions">
                      <Link className="mini-button" to={`/tables/edit/${table.id}`} onClick={(event) => event.stopPropagation()}>
                        <Eye size={16} />
                      </Link>
                      <button className="mini-button">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-footer">Показано {filteredTables.length} из {tables.length} таблиц</div>
        </div>
      </section>

      <aside className="preview-panel">
        {selected ? (
          <>
            <h2>Предпросмотр таблицы</h2>
            <div className="preview-title">
              <TableIcon icon={selected.icon} />
              <div>
                <h3>{selected.name}</h3>
                <span className="source-line"><span className="source-pill">P</span> Pydantic</span>
              </div>
            </div>

            <div className="meta-list">
              <div><span>Название</span><strong>{selected.label}</strong></div>
              <div><span>Имя в БД</span><strong>{selected.dbName}</strong></div>
              <div><span>Описание</span><strong>{selected.description || "—"}</strong></div>
              <div><span>Поля</span><strong>{selected.fieldsCount ?? 0}</strong></div>
              <div><span>Обязательные поля</span><strong>{selected.requiredFieldsCount ?? 0}</strong></div>
            </div>

            <div className="checklist">
              <div className="checklist-header">
                <strong>Что осталось настроить</strong>
              </div>
              {[
                ["Названия полей", true],
                ["Типы полей", true],
                ["Отображение в таблице", false],
                ["Фильтры и сортировка", false]
              ].map(([label, done]) => (
                <div className="check-item" key={label as string}>
                  <span className={done ? "check-dot done" : "check-dot"} />
                  {label}
                </div>
              ))}
            </div>

            <Link className="button button-primary button-full" to={`/tables/edit/${selected.id}`}>
              <Pencil size={18} />
              Редактировать таблицу
            </Link>
          </>
        ) : (
          <div className="empty-state">Выберите таблицу</div>
        )}
      </aside>
    </div>
  );
}
