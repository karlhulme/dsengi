import { DocRecord } from "../doc/index.ts";

/**
 * Defines the shape of the response following a request to
 * replace a document.
 */
export interface ReplaceDocumentResult {
  /**
   * True if a new document was created.
   */
  isNew: boolean;

  /**
   * The updated document.
   */
  doc: DocRecord;
}
