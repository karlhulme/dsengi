import { DocBase } from "../doc/index.ts";

/**
 * Defines the shape of the response following a request to
 * select all documents from a collection.
 */
export interface SelectDocumentsResult<Doc extends DocBase> {
  /**
   * An array of documents.
   */
  docs: Doc[];
}
