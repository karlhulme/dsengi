/**
 * Defines the properties that are required to retrieve a
 * single document from a collection using a document id.
 */
export interface SelectDocumentByIdProps<
  DocTypeNames extends string,
> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: DocTypeNames;

  /**
   * The name of a document partition.
   */
  partition: string | null;

  /**
   * A document id.
   */
  id: string;

  /**
   * If specified, attempt will be made to load the documents
   * from a cache.  If that fails, any fetched documents will
   * be cached for the given number of milliseconds.
   */
  cacheMilliseconds?: number;
}
