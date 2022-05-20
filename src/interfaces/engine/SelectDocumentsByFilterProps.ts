/**
 * Defines the properties that are required to select from a
 * document collection using a filter.
 */
export interface SelectDocumentsByFilterProps<RequestProps, DocStoreOptions> {
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
   * The name of the filter to apply.
   */
  filterName: string;

  /**
   * The parameters to be passed to the filter.
   */
  filterParams: unknown;

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
   * The user that is making the request.
   */
  user: unknown;
}
