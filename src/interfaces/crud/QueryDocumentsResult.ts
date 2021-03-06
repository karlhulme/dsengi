/**
 * Defines the shape of the response following a request to
 * execute a query against the collection.
 */
export interface QueryDocumentsResult<QueryResult> {
  /**
   * The result of executing the query.
   */
  data: QueryResult;
}
