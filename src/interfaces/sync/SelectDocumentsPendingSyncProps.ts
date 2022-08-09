/**
 * Defines the properties that are required to select documents
 * that have not yet been synchronised.
 */
export interface SelectDocumentsPendingSyncProps<DocStoreParams> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * The parameters to be passed to the document store.
   */
  docStoreParams: DocStoreParams;
}
