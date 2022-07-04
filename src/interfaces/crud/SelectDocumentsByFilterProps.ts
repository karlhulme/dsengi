/**
 * Defines the properties that are required to select from a
 * document collection using a filter.
 */
export interface SelectDocumentsByFilterProps<
  Filter,
  FilterParams,
  DocStoreParams,
> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * The name of a document partition.
   */
  partition: string;

  /**
   * A function that validates the filter parameters.
   */
  // deno-lint-ignore no-explicit-any
  validateParams: (params: any) => string | void;

  /**
   * A function that converts the filter parameters into a filter
   * that the document store can interpret.
   */
  implementation: (params: FilterParams, userId: string) => Filter;

  /**
   * The parameters to be passed to the filter.
   */
  filterParams: FilterParams;

  /**
   * The parameters to be passed to the document store.
   */
  docStoreParams: DocStoreParams;

  /**
   * The id of the user that is making the request.
   */
  userId: string;
}
