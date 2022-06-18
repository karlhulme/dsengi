/**
 * Defines the properties that are required to execute a query
 * against the collection.
 */
export interface QueryDocumentsProps<RequestProps, DocStoreOptions> {
  /**
   * The api key associated with the request.
   */
  apiKey: string;

  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * The name of a query defined on the document type.
   */
  queryName: string;

  /**
   * A set of query parameters.
   */
  queryParams: unknown;

  /**
   * The properties passed with the request.
   */
  reqProps: RequestProps;

  /**
   * The document store options passed with the request.
   */
  docStoreOptions: DocStoreOptions;

  /**
   * The id of the user that is making the request.
   */
  userId: string;

  /**
   * An array of the claims that are held by the user.
   */
  userClaims: string[];
}
