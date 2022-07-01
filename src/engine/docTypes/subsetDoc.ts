import { DocBase } from "../../interfaces/index.ts";

/**
 * Returns a subset of the given document such that only the permitted
 * fields are included.
 * @param doc The document to redact.
 * @param retainedFieldNames An array of field names indicating which
 * fields should be copied to the new document.
 */
export function subsetDoc<Doc extends DocBase>(
  doc: Partial<Doc>,
  retainedFieldNames: (keyof Doc)[],
): Partial<Doc> {
  const docRecord = doc as Record<string, unknown>;
  const subsetDocRecord: Record<string, unknown> = {};

  for (const fieldName of retainedFieldNames) {
    const fieldNameString = fieldName as string;
    if (typeof docRecord[fieldNameString] !== "undefined") {
      subsetDocRecord[fieldNameString] = docRecord[fieldNameString];
    }
  }

  return subsetDocRecord as Partial<Doc>;
}
