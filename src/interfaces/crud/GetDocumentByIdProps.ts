/**
 * Defines the properties that are required to get a
 * single document from a collection using a document id.
 */
export interface GetDocumentByIdProps<DocStoreParams> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * The name of a document partition.
   */
  partition: string;

  /**
   * A document id.
   */
  id: string;

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
