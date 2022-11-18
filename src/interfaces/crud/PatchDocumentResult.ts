import { DocBase, DocChange } from "../doc/index.ts";

/**
 * Defines the shape of the response following a request to patch a document.
 */
export interface PatchDocumentResult<Doc extends DocBase> {
  /**
   * The updated document.
   */
  doc: Doc;

  /**
   * The details of the change.
   * This will be populated if the docType trackChanges property is true.
   */
  change: DocChange<Doc> | null;
}
