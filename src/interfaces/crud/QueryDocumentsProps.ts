/**
 * Defines the properties that are required to execute a query
 * against the collection.
 */
export interface QueryDocumentsProps<
  Query,
  QueryResult,
  DocStoreParams,
> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * A query that can be executed by the document store.
   */
  query: Query;

  /**
   * A function that converts the object returned from the query
   * into a known result form.
   */
  coerceResult: (queryRawResult: unknown) => QueryResult;

  /**
   * The parameters to be passed to the document store.
   */
  docStoreParams: DocStoreParams;
}
