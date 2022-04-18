/**
 * Defines the shape of the response following a request to
 * save a new document.
 */
export interface NewDocumentResult {
  /**
   * True if a new document was created.
   */
  isNew: boolean;
}
