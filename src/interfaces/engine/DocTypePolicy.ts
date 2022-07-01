/**
 * Defines the allowed and disallowed actions for a document type.
 */
export interface DocTypePolicy {
  /**
   * True if the document can be deleted.
   */
  canDeleteDocuments?: boolean;

  /**
   * True if a client can request all of the documents in the collection.
   */
  canFetchWholeCollection?: boolean;

  /**
   * True if a client can replace a document directly.
   */
  canReplaceDocuments?: boolean;

  /**
   * The maximum number of operation ids to store in the document.  The history
   * of operation ids is used to prevent the same operation or patch from
   * being applied multiple times.
   */
  maxOpIds?: number;
}
