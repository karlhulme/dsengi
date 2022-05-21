/**
 * Defines the properties that are required to operation on a document.
 */
export interface OperateOnDocumentProps<RequestProps, DocStoreOptions> {
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
   * The id of a document.
   */
  id: string;

  /**
   * The id of the operation to carry out.
   */
  operationId: string;

  /**
   * The name of the operation to invoke.
   */
  operationName: string;

  /**
   * The parameters to pass to the operation.
   */
  operationParams: unknown;

  /**
   * The properties passed with the request.
   */
  reqProps: RequestProps;

  /**
   * The document store options passed with the request.
   */
  docStoreOptions: DocStoreOptions;

  /**
   * The required version of the document.  If specified, then this
   * property defines the version of the document that must be
   * found in the collection otherwise the operation will not be applied.
   */
  reqVersion?: string;

  /**
   * The user that is making the request.
   */
  user: unknown;

  /**
   * An array of fields to be returned after the operation.
   */
  fieldNames: string[];
}
