/**
 * The result from a document store when requesting
 * the list of documents awaiting synchronisation.
 */
export interface DocStorePendingSyncResult {
  /**
   * A collection of headers identifying the documents
   * that need synchronisation.
   */
  docHeaders: DocStorePendingSyncResultDocHeader[];

  /**
   * The relative cost of performing the query.
   */
  queryCharge: number;
}

/**
 * Represents a single document that is pending sychronisation.
 */
export interface DocStorePendingSyncResultDocHeader {
  /**
   * The id of a document that is pending synchronisation.
   */
  id: string;

  /**
   * The partition of a document that is pending synchronisation.
   */
  partition: string;

  /**
   * The version of a document that is pending synchronisation.
   */
  docVersion: string;
}
