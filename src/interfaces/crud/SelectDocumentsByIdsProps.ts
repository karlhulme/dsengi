/**
 * Defines the properties that are required to retrieve a set of
 * documents from a collection using a set of document ids.
 */
export interface SelectDocumentsByIdsProps<Doc, DocStoreParams> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * The name of a document partition.
   */
  partition: string;

  /**
   * An array of document ids.
   */
  ids: string[];

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
