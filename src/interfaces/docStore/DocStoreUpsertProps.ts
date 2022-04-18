/**
 * The additional parameters that can be supplied when upserting a document.
 */
export interface DocStoreUpsertProps {
  /**
   * If populated, this property specifies the required version of the document.
   * If the required version is not found in the collection that it cannot be
   * replaced.
   */
  reqVersion?: string;
}
