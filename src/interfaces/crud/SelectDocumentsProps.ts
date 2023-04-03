/**
 * The statuses of the documents.
 */
export type SelectDocumentsStatuses =
  | "all"
  | "active"
  | "archived";

/**
 * Defines the properties that are required to extract all
 * the documents from a collection.
 */
export interface SelectDocumentsProps<
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
   * The document statuses that should be included in the response.
   * If not specified, all document statuses shall be included.
   */
  statuses?: SelectDocumentsStatuses;
}
