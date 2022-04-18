/**
 * Defines the shape of the response following a request to patch a document.
 */
export interface PatchDocumentResult {
  /**
   * True if a document was updated.
   */
  isUpdated: boolean;
}
