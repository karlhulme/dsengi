/**
 * Defines the shape of the response following a request to delete a document.
 */
export interface DeleteDocumentResult {
  /**
   * True if a document was deleted.
   */
  isDeleted: boolean;
}
