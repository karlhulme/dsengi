/**
 * Defines the shape of the response following a request to operate on a document.
 */
export interface OperateOnDocumentResult {
  /**
   * True if a document was updated.
   */
  isUpdated: boolean;
}
