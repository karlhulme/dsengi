/**
 * Defines the properties that are required to extract all
 * the documents from a collection.
 */
export interface SelectDocumentsProps<DocStoreParams> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * The name of a document partition.
   */
  partition: string;

  /**
   * True if archived documents should be included in the response.
   */
  includeArchived: boolean;

  /**
   * The parameters to be passed to the document store.
   */
  docStoreParams: DocStoreParams;
}
