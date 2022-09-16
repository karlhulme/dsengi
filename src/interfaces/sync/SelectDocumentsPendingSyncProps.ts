/**
 * Defines the properties that are required to select documents
 * that have not yet been synchronised.
 */
export interface SelectDocumentsPendingSyncProps<
  DocTypeNames extends string,
  DocStoreParams,
> {
  /**
   * An array of queries to execute.
   */
  queries: SelectDocumentsPendingSyncPropsQuery<DocTypeNames, DocStoreParams>[];
}

export interface SelectDocumentsPendingSyncPropsQuery<
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
}
