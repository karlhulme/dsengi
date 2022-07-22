/**
 * Defines the properties that are required to select from a
 * document collection using a filter.
 */
export interface SelectDocumentsByFilterProps<
  Filter,
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
   * A filter object that the document store knows how to apply.
   */
  filter: Filter;

  /**
   * True if archived documents should be included in the response.
   */
  includeArchived: boolean;

  /**
   * The parameters to be passed to the document store.
   */
  docStoreParams: DocStoreParams;
}
