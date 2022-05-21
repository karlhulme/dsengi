import { DocRecord } from "../../interfaces/index.ts";

/**
 * Returns a subset of the given document such that only the permitted
 * fields are included.  If the client has rights to all fields then
 * the original document is returned.
 * @param client An authenticated client.
 * @param docTypeName The name of a document type.
 * @param doc A document.
 */
export function redactDoc(doc: DocRecord, fieldNames: string[]): DocRecord {
  const redactedDoc: DocRecord = {};

  for (const fieldName of fieldNames) {
    if (typeof doc[fieldName] !== "undefined") {
      redactedDoc[fieldName] = doc[fieldName];
    }
  }

  return redactedDoc;
}
