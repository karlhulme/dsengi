/**
 * Defines the results returned from an operation that selects the
 * documents that are waiting for synchronisation.
 */
export interface SelectDocumentsPendingSyncResult {
  /**
   * An array of document headers that refer to documents
   * that are waiting to be synchronised.
   */
  docHeaders: SelectDocumentsPendingSyncResultDocHeader[];
}

/**
 * Represents a single document that is waiting to be synchronised.
 */
export interface SelectDocumentsPendingSyncResultDocHeader {
  /**
   * The id of a document.
   */
  id: string;

  /**
   * The partition of the document.
   */
  partition: string | null;

  /**
   * The name of the document type.
   */
  docTypeName: string;

  /**
   * The version of the document.
   */
  docVersion: string;
}
