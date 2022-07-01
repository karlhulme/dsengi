/**
 * Defines the properties that are required to execute a query
 * against the collection.
 */
export interface QueryDocumentsProps<
  Query,
  QueryParams,
  QueryResult,
  DocStoreParams,
> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * A function that validates a given set of parameters.
   */
  // deno-lint-ignore no-explicit-any
  validateParams: (params: any) => string | void;

  /**
   * A function that converts the query parameters into a query
   * that the document store can issue.
   */
  parseParams: (params: QueryParams, userId: string) => Query;

  /**
   * A function that converts the object returned from the query
   * into a known result form.
   */
  coerceResult: (queryResult: unknown) => QueryResult;

  /**
   * A function that validates the coerced result.
   */
  // deno-lint-ignore no-explicit-any
  validateResult: (params: any) => string | void;

  /**
   * The parameters to be passed to the query.
   */
  queryParams: QueryParams;

  /**
   * The parameters to be passed to the document store.
   */
  docStoreParams: DocStoreParams;

  /**
   * The id of the user that is making the request.
   */
  userId: string;
}
