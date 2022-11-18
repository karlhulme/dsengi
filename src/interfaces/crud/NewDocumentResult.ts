import { DocBase, DocChange } from "../doc/index.ts";

/**
 * Defines the shape of the response following a request to
 * save a new document.
 */
export interface NewDocumentResult<Doc extends DocBase> {
  /**
   * The document that was created or the document that already existed.
   */
  doc: Doc;

  /**
   * The details of the change.
   * This will be populated if the docType trackChanges property is true.
   */
  change: DocChange<Doc> | null;
}
