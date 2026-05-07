import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AdminTableFormValues } from "@ommr/shared/zod";
import { toCreateTablePayload, toUpdateTablePayload } from "./table-form-mappers";

const baseValues: AdminTableFormValues = {
  name: " cargoes ",
  label: " Грузы ",
  description: "  ",
  status: "draft",
  source: "manual",
  icon: "table",
  group: "master_tables",
  groupName: "Мастер-таблицы",
  showInMenu: true,
  canList: true,
  canCreate: false,
  canEdit: true,
  canDelete: false,
};

describe("table form mappers", () => {
  it("builds create payload from shared form values", () => {
    assert.deepEqual(toCreateTablePayload(baseValues), {
      name: "cargoes",
      label: "Грузы",
      description: null,
      status: "draft",
      source: "manual",
      icon: "table",
      group: "master_tables",
      groupName: "Мастер-таблицы",
      showInMenu: true,
      canList: true,
      canCreate: false,
      canEdit: true,
      canDelete: false,
    });
  });

  it("builds edit payload without source", () => {
    assert.deepEqual(toUpdateTablePayload(baseValues), {
      name: "cargoes",
      label: "Грузы",
      description: null,
      status: "draft",
      icon: "table",
      group: "master_tables",
      groupName: "Мастер-таблицы",
      showInMenu: true,
      canList: true,
      canCreate: false,
      canEdit: true,
      canDelete: false,
    });
  });
});
