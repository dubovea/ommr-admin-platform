import { useEffect, useMemo, useState } from "react";
import { Link2, Pencil, Save, Trash2, Upload, X } from "lucide-react";
import { useParams } from "react-router";
import {
  FIELD_INPUT_TYPE_LABELS,
  FIELD_INPUT_TYPES,
  type AdminFieldFlagKey,
  type AdminFieldMeta,
  type AdminTableActionKey,
  type AdminTableMeta,
  type RelationType
} from "@ommr/shared";
import { getTable, updateField, updateTable } from "../api/adminApi";

export function EditTablePage() {
  const { id } = useParams<{ id: string }>();
  const [table, setTable] = useState<AdminTableMeta | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    getTable(id).then((data) => {
      setTable(data);
      setSelectedFieldId(
        data.fields?.find((field) => field.name === "user_id")?.id ??
          data.fields?.[0]?.id ??
          null
      );
    });
  }, [id]);

  const fields = table?.fields ?? [];

  const selectedField = useMemo(() => {
    return fields.find((field) => field.id === selectedFieldId) ?? fields[0] ?? null;
  }, [fields, selectedFieldId]);

  async function saveTable() {
    if (!table) return;

    setIsSaving(true);

    try {
      const updated = await updateTable(table.id, {
        label: table.label,
        dbName: table.dbName,
        name: table.name,
        description: table.description,
        canList: table.canList,
        canCreate: table.canCreate,
        canEdit: table.canEdit,
        canDelete: table.canDelete,
        status: table.status
      });

      setTable((current) => current ? { ...current, ...updated } : current);
    } finally {
      setIsSaving(false);
    }
  }

  async function patchSelectedField(payload: Partial<AdminFieldMeta>) {
    if (!selectedField || !table) return;

    const optimisticField = {
      ...selectedField,
      ...payload
    };

    setTable({
      ...table,
      fields: fields.map((field) =>
        field.id === selectedField.id ? optimisticField : field
      )
    });

    const updated = await updateField(selectedField.id, payload);

    setTable((current) => {
      if (!current) return current;

      return {
        ...current,
        fields: current.fields?.map((field) =>
          field.id === updated.id ? updated : field
        )
      };
    });
  }

  if (!table) {
    return <div className="loading">Загружаем таблицу...</div>;
  }

  return (
    <div className="edit-page">
      <div className="edit-header">
        <div>
          <div className="breadcrumbs">Таблицы / Редактирование таблицы</div>
          <div className="title-row">
            <h1>Редактирование таблицы / {table.name}</h1>
            <span className="status-badge status-draft">Черновик</span>
          </div>
        </div>

        <button className="button button-primary" onClick={saveTable} disabled={isSaving}>
          <Save size={18} />
          {isSaving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>

      <div className="info-banner">
        <div className="info-icon">i</div>
        <div>
          <strong>Импортирована только базовая информация из Pydantic.</strong>
          <p>Настройте остальные параметры таблицы и отображения на этой странице.</p>
        </div>
      </div>

      <div className="tabs">
        <button>Общее</button>
        <button className="active">Поля</button>
        <button>Отображение</button>
      </div>

      <div className="edit-layout">
        <section className="edit-main">
          <div className="settings-grid">
            <div className="card form-card">
              <h2>Основная информация</h2>

              <label>
                <span>Отображаемое имя *</span>
                <input
                  value={table.label}
                  onChange={(event) => setTable({ ...table, label: event.target.value })}
                />
              </label>

              <label>
                <span>Имя таблицы в БД *</span>
                <input
                  value={table.dbName}
                  onChange={(event) => setTable({ ...table, dbName: event.target.value })}
                />
              </label>

              <label>
                <span>Ключ ресурса *</span>
                <input
                  value={table.name}
                  onChange={(event) => setTable({ ...table, name: event.target.value })}
                />
              </label>

              <label>
                <span>Описание</span>
                <textarea
                  value={table.description ?? ""}
                  onChange={(event) => setTable({ ...table, description: event.target.value })}
                />
              </label>
            </div>

            <div className="card actions-card">
              <h2>Доступные действия</h2>

              {(
                [
                  ["canList", "Список"],
                  ["canCreate", "Создание"],
                  ["canEdit", "Редактирование"],
                  ["canDelete", "Удаление"]
                ] satisfies Array<[AdminTableActionKey, string]>
              ).map(([key, label]) => (
                <label className="toggle-row" key={key}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={table[key]}
                    onChange={(event) =>
                      setTable({
                        ...table,
                        [key]: event.target.checked
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="card fields-card">
            <div className="card-header">
              <h2>Поля таблицы</h2>
              <div className="header-actions">
                <button className="button button-ghost">+ Добавить поле</button>
                <button className="button button-ghost">
                  <Upload size={16} />
                  Импортировать поля
                </button>
              </div>
            </div>

            <table className="fields-table">
              <thead>
                <tr>
                  <th>Поле</th>
                  <th>Тип поля</th>
                  <th>Обязательное</th>
                  <th>Редактируемое</th>
                  <th>Сортировка</th>
                  <th>Фильтр</th>
                  <th>Показывать в таблице</th>
                  <th>Показывать в форме</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => (
                  <tr
                    key={field.id}
                    className={field.id === selectedField?.id ? "selected-row" : ""}
                    onClick={() => setSelectedFieldId(field.id)}
                  >
                    <td>
                      <div className="field-name">
                        <span className="drag-handle">⋮⋮</span>
                        {field.relation && <Link2 size={16} />}
                        <strong>{field.name}</strong>
                      </div>
                    </td>
                    <td>{FIELD_INPUT_TYPE_LABELS[field.inputType]}</td>
                    <td><input type="checkbox" checked={field.required} readOnly /></td>
                    <td><input type="checkbox" checked={field.editable} readOnly /></td>
                    <td><input type="checkbox" checked={field.sortable} readOnly /></td>
                    <td><input type="checkbox" checked={field.filterable} readOnly /></td>
                    <td><input type="checkbox" checked={field.showInList} readOnly /></td>
                    <td><input type="checkbox" checked={field.showInForm} readOnly /></td>
                    <td>
                      <div className="row-actions">
                        <button className="mini-button"><Pencil size={15} /></button>
                        <button className="mini-button"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="field-inspector">
          {selectedField ? (
            <FieldInspector field={selectedField} onChange={patchSelectedField} />
          ) : (
            <div className="empty-state">Выберите поле</div>
          )}
        </aside>
      </div>
    </div>
  );
}

function FieldInspector({
  field,
  onChange
}: {
  field: AdminFieldMeta;
  onChange: (payload: Partial<AdminFieldMeta>) => void;
}) {
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(true);

  return (
    <>
      <div className="inspector-header">
        <h2>Настройки поля</h2>
        <button className="mini-button"><X size={16} /></button>
      </div>

      <div className="field-summary">
        <div className="field-icon">
          <Link2 size={18} />
        </div>
        <div>
          <strong>{field.name}</strong>
          <span>{field.relation ? "Поле связи" : field.dbType}</span>
        </div>
      </div>

      <label>
        <span>Label *</span>
        <input
          value={field.label}
          onChange={(event) => onChange({ label: event.target.value })}
        />
      </label>

      <div className="select-field">
        <span>Тип поля *</span>
        <button
          className="select-trigger"
          type="button"
          onClick={() => setIsTypeDropdownOpen((value) => !value)}
        >
          {FIELD_INPUT_TYPE_LABELS[field.inputType]}
          <span>⌄</span>
        </button>

        {isTypeDropdownOpen && (
          <div className="select-menu">
            {FIELD_INPUT_TYPES.map((type) => (
              <button
                key={type}
                className={type === field.inputType ? "selected" : ""}
                type="button"
                onClick={() => {
                  onChange({
                    inputType: type,
                    relation:
                      type === "select" || type === "multiselect"
                        ? field.relation ?? {
                            targetTable: "users",
                            relationType: "many-to-one",
                            displayField: "full_name"
                          }
                        : null
                  });
                }}
              >
                {FIELD_INPUT_TYPE_LABELS[type]}
                {type === field.inputType && <span>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <label>
        <span>Placeholder</span>
        <input
          value={field.placeholder ?? ""}
          onChange={(event) => onChange({ placeholder: event.target.value })}
        />
      </label>

      <label>
        <span>Подсказка</span>
        <textarea
          value={field.helpText ?? ""}
          onChange={(event) => onChange({ helpText: event.target.value })}
        />
      </label>

      <div className="toggle-stack">
        {(
          [
            ["required", "Обязательное поле"],
            ["editable", "Редактируемое поле"],
            ["showInList", "Показывать в таблице"],
            ["showInForm", "Показывать в форме"]
          ] satisfies Array<[AdminFieldFlagKey, string]>
        ).map(([key, label]) => (
          <label className="toggle-row" key={key}>
            <span>{label}</span>
            <input
              type="checkbox"
              checked={field[key]}
              onChange={(event) => onChange({ [key]: event.target.checked })}
            />
          </label>
        ))}
      </div>

      {(field.inputType === "select" || field.inputType === "multiselect") && (
        <div className="relation-box">
          <h3>Настройки связи</h3>

          <label>
            <span>Целевая таблица *</span>
            <select
              value={field.relation?.targetTable ?? "users"}
              onChange={(event) =>
                onChange({
                  relation: {
                    targetTable: event.target.value,
                    relationType: field.relation?.relationType ?? "many-to-one",
                    displayField: field.relation?.displayField ?? "full_name"
                  }
                })
              }
            >
              <option value="users">users</option>
              <option value="products">products</option>
              <option value="categories">categories</option>
            </select>
          </label>

          <label>
            <span>Тип связи</span>
            <select
              value={field.relation?.relationType ?? "many-to-one"}
              onChange={(event) =>
                onChange({
                  relation: {
                    targetTable: field.relation?.targetTable ?? "users",
                    relationType: event.target.value as RelationType,
                    displayField: field.relation?.displayField ?? "full_name"
                  }
                })
              }
            >
              <option value="many-to-one">Многие к одному (N:1)</option>
              <option value="one-to-one">Один к одному (1:1)</option>
            </select>
          </label>

          <label>
            <span>Отображаемое поле *</span>
            <select
              value={field.relation?.displayField ?? "full_name"}
              onChange={(event) =>
                onChange({
                  relation: {
                    targetTable: field.relation?.targetTable ?? "users",
                    relationType: field.relation?.relationType ?? "many-to-one",
                    displayField: event.target.value
                  }
                })
              }
            >
              <option value="full_name">full_name</option>
              <option value="name">name</option>
              <option value="title">title</option>
            </select>
          </label>
        </div>
      )}
    </>
  );
}
