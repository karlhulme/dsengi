import { DocBase } from "../doc/index.ts";

/**
 * Defines the shape of the response following a request to
 * construct a document using a constructor.
 */
export interface ConstructDocumentResult<Doc extends DocBase> {
  /**
   * True if a new document was created.
   */
  isNew: boolean;

  /**
   * The document that was created or the document that already existed.
   */
  doc: Partial<Doc>;
}
