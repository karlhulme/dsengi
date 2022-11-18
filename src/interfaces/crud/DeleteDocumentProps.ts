/**
 * Defines the properties that are required to delete a document.
 */
export interface DeleteDocumentProps<
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
   * The id of the operation.
   */
  operationId: string;

  /**
   * The id of a document.
   */
  id: string;

  /**
   * The id of the user that is making the request.
   */
  userId: string;
}
