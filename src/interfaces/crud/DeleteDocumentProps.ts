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
   * The id of a document.
   */
  id: string;

  /**
   * True if a change event should be written to the changeEvents container
   * of the document store and then later raised as an event.
   */
  raiseChangeEvent?: boolean;

  /**
   * The name of the partition where the change event should be stored.
   * If raiseChangeEvent is true, but this value is omitted, then the
   * partition property is used.
   */
  raiseChangeEventPartition?: string;
}
