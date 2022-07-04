/**
 * Defines the properties that are required to retrieve a set of
 * documents from a collection using a set of document ids.
 */
export interface SelectDocumentsByIdsProps<DocStoreParams> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * The name of a document partition.
   */
  partition: string;

  /**
   * An array of document ids.
   */
  ids: string[];

  /**
   * The parameters to be passed to the document store.
   */
  docStoreParams: DocStoreParams;

  /**
   * The id of the user that is making the request.
   */
  userId: string;

  /**
   * If specified, attempt will be made to load the documents
   * from a cache.  If that fails, any fetched documents will
   * be cached for the given number of milliseconds.
   */
  cacheMilliseconds?: number;
}
