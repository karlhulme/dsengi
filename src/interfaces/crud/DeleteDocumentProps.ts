/**
 * Defines the properties that are required to delete a document.
 */
export interface DeleteDocumentProps<DocStoreParams> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * The name of a document partition.
   */
  partition: string;

  /**
   * The id of a document.
   */
  id: string;

  /**
   * The parameters to be passed to the document store.
   */
  docStoreParams: DocStoreParams;
}
