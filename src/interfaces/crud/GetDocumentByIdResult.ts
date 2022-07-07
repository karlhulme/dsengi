import { DocBase } from "../doc/index.ts";

/**
 * Defines the shape of the response following a request to
 * get a document using a document id.  If the document
 * cannot be found then an error is raised.
 */
export interface GetDocumentByIdResult<Doc extends DocBase> {
  /**
   * A document.
   */
  doc: Doc;
}
