import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parsePydanticJsonSchema } from "./pydantic-schema-parser.service";

describe("parsePydanticJsonSchema", () => {
  it("imports tables and fields from backend schema_pydantic_example.json", () => {
    const file = fileURLToPath(
      new URL("../../schema_pydantic_example.json", import.meta.url),
    );
    const schema = JSON.parse(readFileSync(file, "utf8")) as unknown;

    const tables = parsePydanticJsonSchema(schema);

    assert.ok(tables.length > 0);

    const cargoes = tables.find((table) => table.name === "cargoes");
    assert.ok(cargoes);
    assert.equal(cargoes?.label, "Грузы");
    assert.equal(cargoes?.group, "master_tables");
    assert.equal(cargoes?.fields.some((field) => field.name === "name"), true);
  });

  it("maps relation metadata from x-relation", () => {
    const schema = {
      type: "object",
      properties: {
        load_rack_variants: {
          $ref: "#/$defs/LoadRackVariantsData",
          title: "ЭстакадыВарианты",
        },
      },
      $defs: {
        LoadRackVariantsData: {
          type: "object",
          properties: {
            cargoes: {
              type: "array",
              title: "Грузы",
              items: { type: "string" },
              "x-relation": {
                to_table: "cargoes",
                link_key: "code",
                display_field: "name",
              },
            },
          },
        },
      },
    };

    const [table] = parsePydanticJsonSchema(schema);
    const [field] = table.fields;

    assert.equal(field.inputType, "multiselect");
    assert.deepEqual(field.relation, {
      targetTable: "cargoes",
      targetKey: "code",
      displayField: "name",
      additionalText: null,
    });
  });

  it("maps required from object arrays and field booleans", () => {
    const schema = {
      type: "object",
      properties: {
        sample_items: {
          $ref: "#/$defs/SampleItem",
          title: "Sample Items",
        },
      },
      $defs: {
        SampleItem: {
          type: "object",
          required: ["from_array", "overridden"],
          properties: {
            from_array: {
              type: "string",
              title: "From Array",
            },
            overridden: {
              type: "string",
              required: false,
              title: "Overridden",
            },
            explicit: {
              type: "string",
              required: true,
              title: "Explicit",
            },
          },
        },
      },
    };

    const [table] = parsePydanticJsonSchema(schema);
    const fieldsByName = new Map(
      table.fields.map((field) => [field.name, field]),
    );

    assert.equal(fieldsByName.get("from_array")?.required, true);
    assert.equal(fieldsByName.get("overridden")?.required, false);
    assert.equal(fieldsByName.get("explicit")?.required, true);
  });
});
