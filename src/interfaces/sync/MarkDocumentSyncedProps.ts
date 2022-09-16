export interface MarkDocumentSyncedProps<
  DocTypeNames extends string,
> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: DocTypeNames;

  /**
   * The id of a document.
   */
  id: string;

  /**
   * The partition of the document.
   */
  partition: string | null;

  /**
   * The required version of the document.
   */
  reqVersion: string;
}
