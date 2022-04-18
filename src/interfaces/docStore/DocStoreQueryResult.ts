/**
 * The result from a document store of executing a query.
 */
export interface DocStoreQueryResult<QueryResult> {
  /**
   * A result object that contains the data from the document store
   * as a result of executing a query.
   */
  data: QueryResult;
}
