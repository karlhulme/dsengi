/**
 * The result of deleting a document.
 */
export enum DocStoreDeleteByIdResultCode {
  /**
   * A document was deleted.
   */
  DELETED,

  /**
   * The document was not found and so no document was deleted.
   * The document may have been deleted previously.
   */
  NOT_FOUND,
}
