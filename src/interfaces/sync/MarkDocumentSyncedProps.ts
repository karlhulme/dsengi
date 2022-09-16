export interface MarkDocumentSyncedProps<
  DocTypeNames extends string,
  DocStoreParams,
> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: DocTypeNames;

  /**
   * The parameters to be passed to the document store.
   */
  docStoreParams: DocStoreParams;

  /**
   * The id of a document.
   */
  id: string;

  /**
   * The partition of the document.
   */
  partition: string;

  /**
   * The required version of the document.
   */
  reqVersion: string;
}
