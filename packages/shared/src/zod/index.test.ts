import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createFieldSchema,
  createTableSchema,
  importPydanticSchemaRequestSchema,
  updateTableSchema,
} from "./index";

describe("shared zod schemas", () => {
  it("validates create table payload with menu/action settings", () => {
    const payload = createTableSchema.parse({
      name: "cargoes",
      label: "Грузы",
      description: "Справочник грузов",
      status: "draft",
      source: "manual",
      group: "master_tables",
      groupName: "Мастер-таблицы",
      showInMenu: true,
      canList: true,
      canCreate: false,
      canEdit: true,
      canDelete: false,
    });

    assert.deepEqual(
      {
        name: payload.name,
        label: payload.label,
        canCreate: payload.canCreate,
        canDelete: payload.canDelete,
        source: payload.source,
      },
      {
        name: "cargoes",
        label: "Грузы",
        canCreate: false,
        canDelete: false,
        source: "manual",
      },
    );
  });

  it("applies create table defaults", () => {
    const payload = createTableSchema.parse({
      name: "tracks",
      label: "Пути",
    });

    assert.deepEqual(
      {
        status: payload.status,
        source: payload.source,
        icon: payload.icon,
        showInMenu: payload.showInMenu,
        canList: payload.canList,
        canCreate: payload.canCreate,
        canEdit: payload.canEdit,
        canDelete: payload.canDelete,
      },
      {
        status: "draft",
        source: "manual",
        icon: "table",
        showInMenu: true,
        canList: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      },
    );
  });

  it("validates partial table update payload", () => {
    const payload = updateTableSchema.parse({
      label: "Новое имя",
      canDelete: false,
    });

    assert.deepEqual(payload, {
      label: "Новое имя",
      canDelete: false,
    });
  });

  it("rejects invalid create field table id", () => {
    const result = createFieldSchema.safeParse({
      tableId: "not-uuid",
      name: "name",
      label: "Name",
      inputType: "text",
    });

    assert.equal(result.success, false);
  });

  it("validates pydantic import request wrapper", () => {
    const result = importPydanticSchemaRequestSchema.parse({
      schema: { type: "object" },
    });

    assert.deepEqual(result.schema, { type: "object" });
  });
});
