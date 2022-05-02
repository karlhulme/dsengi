import { SengiNewDocIdMismatch } from "../../interfaces/index.ts";

/**
 * Raises an error if the id property of a document is supplied but
 * does not match the id of a request.
 * @param requestId The id passed with the request.
 * @param docId The id property of the new document.
 */
export function ensureNewDocIdsMatch(requestId: string, docId?: string): void {
  if (typeof docId !== "undefined" && docId !== requestId) {
    throw new SengiNewDocIdMismatch(docId, requestId);
  }
}
