import { DocBase } from "../doc/index.ts";

/**
 * Defines the shape of the response following a request to patch a document.
 */
export interface PatchDocumentResult<Doc extends DocBase> {
  /**
   * The updated document.
   */
  doc: Doc;
}
