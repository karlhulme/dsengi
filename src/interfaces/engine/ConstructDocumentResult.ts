/**
 * Defines the shape of the response following a request to
 * construct a document using a constructor.
 */
export interface ConstructDocumentResult {
  /**
   * True if a new document was created.
   */
  isNew: boolean;
}
