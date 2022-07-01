/**
 * Defines the shape of the response following a request to
 * execute a query against the collection.
 */
export interface QueryDocumentsResult<QueryResult> {
  /**
   * A document containing the result of the query.
   */
  data: QueryResult;
}
