import { DocStoreRecord } from "../../interfaces/index.ts";

export function buildChangedFieldBlock(
  doc: DocStoreRecord,
  changeEventFieldNames: string[],
) {
  const fieldBlock: Record<string, unknown> = {};

  for (const fieldName of changeEventFieldNames) {
    fieldBlock[fieldName] = (doc as Record<string, unknown>)[fieldName];
  }

  return fieldBlock;
}
