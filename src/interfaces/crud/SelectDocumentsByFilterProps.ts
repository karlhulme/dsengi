/**
 * Defines the properties that are required to select from a
 * document collection using a filter.
 */
export interface SelectDocumentsByFilterProps<
  DocTypeNames extends string,
  Filter,
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
   * A filter object that the document store knows how to apply.
   */
  filter: Filter;

  /**
   * True if archived documents should be included in the response.
   * By default, archived documents will not be returned.
   */
  includeArchived?: boolean;
}
