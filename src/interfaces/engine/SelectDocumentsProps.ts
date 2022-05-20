/**
 * Defines the properties that are required to extract all
 * the documents from a collection.
 */
export interface SelectDocumentsProps<RequestProps, DocStoreOptions> {
  /**
   * The api key associated with the request.
   */
  apiKey: string;

  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * The name of a document partition.
   */
  partition: string;

  /**
   * An array of fields to be returned with the query.
   */
  fieldNames: string[];

  /**
   * The properties passed with the request.
   */
  reqProps: RequestProps;

  /**
   * The document store options passed with the request.
   */
  docStoreOptions: DocStoreOptions;

  /**
   * The maximum number of documents to return.
   */
  limit?: number;

  /**
   * The number of documents in the result set to skip
   * before returning documents to the client.
   */
  offset?: number;

  /**
   * The user that is making the request.
   */
  user: unknown;
}
