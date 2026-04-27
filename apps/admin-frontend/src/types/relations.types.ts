import type { AdminFieldMeta } from "@ommr/shared";

export type RelationGraphTableField = {
  id: string;
  name: string;
  label: string;
  inputType: AdminFieldMeta["inputType"];
};

export type RelationGraphTable = {
  id: string;
  name: string;
  label: string;
  fields: RelationGraphTableField[];
};

export type RelationGraphRelation = {
  id: string;

  sourceTable: {
    id: string;
    name: string;
    label: string;
  };

  sourceField: {
    id: string;
    name: string;
    label: string;
    inputType: AdminFieldMeta["inputType"];
  };

  targetTable: {
    id: string;
    name: string;
    label: string;
  };

  targetField: {
    name: string;
  };

  relation: {
    targetKey: string;
    displayField: string;
    additionalText: string | null;
  };

  sourceHandle: string;
  targetHandle: string;
};

export type RelationGraphResponse = {
  data: {
    tables: RelationGraphTable[];
    relations: RelationGraphRelation[];
  };
};
