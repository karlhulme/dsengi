import { DocRecord } from "../../interfaces/index.ts";

/**
 * Returns true if the given operation id exists in
 * the array of processed operation ids on the given document.
 * @param doc A document.
 * @param opId The id of an operation.
 */
export function isOpIdInDocument(doc: DocRecord, opId: string): boolean {
  if (Array.isArray(doc.docOpIds)) {
    const docOpIds = doc.docOpIds as string[];
    return docOpIds.includes(opId);
  } else {
    return false;
  }
}
