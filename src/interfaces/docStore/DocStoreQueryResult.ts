/**
 * The result from a document store of executing a query.
 */
export interface DocStoreQueryResult {
  /**
   * A result object that contains the data from the document store
   * as a result of executing a query.  By default this will be an
   * array of values built by combining the results from the logical
   * containers.  Alternatively, a transform function may have been
   * supplied to convert the array of values into a single value.
   */
  data: unknown;
}
