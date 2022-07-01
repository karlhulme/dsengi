/**
 * Defines the properties that are required to extract all
 * the documents from a collection.
 */
export interface SelectDocumentsProps<Doc, DocStoreParams> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * The name of a document partition.
   */
  partition: string;

  /**
   * An array of field names to return.
   */
  fieldNames: (keyof Doc)[];

  /**
   * The parameters to be passed to the document store.
   */
  docStoreParams: DocStoreParams;

  /**
   * The id of the user that is making the request.
   */
  userId: string;
}
