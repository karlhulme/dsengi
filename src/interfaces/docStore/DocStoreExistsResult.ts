/**
 * The result from a document store of determining if a document exists.
 */
export interface DocStoreExistsResult {
  /**
   * True if a document was found to exist.
   */
  found: boolean;
}
