export interface DslCollection {
  system: string;
  name: string;
  pluralName: string;
  idPrefix: string;
  summary: string;
  deprecated?: string;
  tags?: string[];
  labels?: { name: string; value: string }[];
  redactFields?: { fieldName: string; value: unknown }[];
  changeFieldNames?: string[];
  useSinglePartition?: boolean;
  storePatches?: boolean;
  trackChanges?: boolean;

  policy?: {
    canDeleteDocuments?: boolean;
    canFetchWholeCollection?: boolean;
    canReplaceDocuments?: boolean;
    maxDigests?: number;
    maxOpIds?: number;
  };

  properties: {
    name: string;
    summary: string;
    propertyType: string;
    isRequired?: boolean;
    isArray?: boolean;
    deprecated?: string;
  }[];

  types?: {
    enums?: {
      name: string;
      pluralName: string;
      summary: string;
      deprecated?: string;
      tags?: string[];
      labels?: { name: string; value: string }[];
      items: {
        value: string;
        summary?: string;
        deprecated?: string;
      }[];
    }[];

    records?: {
      name: string;
      pluralName: string;
      summary: string;
      deprecated?: string;
      tags?: string[];
      labels?: { name: string; value: string }[];
      properties: {
        name: string;
        summary: string;
        propertyType: string;
        isRequired?: boolean;
        isArray?: boolean;
        deprecated?: string;
      }[];
    }[];
  };
}
