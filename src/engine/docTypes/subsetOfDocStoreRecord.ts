import { DocStoreRecord } from "../../interfaces/index.ts";

/**
 * Returns a subset of the given doc whereby only
 * the fields in the fieldNames array are included.
 * @param doc A document store record.
 * @param fieldNames An array of field names.
 */
export function subsetOfDocStoreRecord(
  doc: DocStoreRecord,
  fieldNames: string[],
) {
  const fieldBlock: Record<string, unknown> = {};

  for (const fieldName of fieldNames) {
    const fieldValue = (doc as Record<string, unknown>)[fieldName];

    if (typeof fieldValue !== "undefined") {
      fieldBlock[fieldName] = fieldValue;
    }
  }

  return fieldBlock;
}
