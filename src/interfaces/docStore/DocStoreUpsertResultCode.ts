/**
 * The result of upserting a document.
 */
export enum DocStoreUpsertResultCode {
  /**
   * A new document was created.
   */
  CREATED,

  /**
   * An existing document was replaced.
   */
  REPLACED,

  /**
   * The required version was not available so no changes were made.
   */
  VERSION_NOT_AVAILABLE,
}
