import { DocBase } from "../doc/index.ts";

/**
 * Defines the shape of the response following a request to
 * select a document using a document id.  If the document
 * is not found then the doc is null.
 */
export interface SelectDocumentByIdResult<Doc extends DocBase> {
  /**
   * A document.
   */
  doc: Doc | null;
}
