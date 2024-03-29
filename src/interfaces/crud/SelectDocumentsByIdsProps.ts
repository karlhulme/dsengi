/**
 * Defines the properties that are required to retrieve a set of
 * documents from a collection using a set of document ids.
 */
export interface SelectDocumentsByIdsProps<
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
   * An array of document ids.
   */
  ids: string[];

  /**
   * If specified, attempt will be made to load the documents
   * from a cache.  If that fails, any fetched documents will
   * be cached for the given number of milliseconds.
   */
  cacheMilliseconds?: number;
}
