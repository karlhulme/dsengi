import { DocBase } from "../doc/index.ts";

/**
 * Defines the properties that are required to operation on a document.
 */
export interface OperateOnDocumentProps<
  Doc extends DocBase,
  OperationParams,
  DocStoreParams,
> {
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
   * A function that validates a given set of parameters.
   */
  // deno-lint-ignore no-explicit-any
  validateParams: (params: any) => string | void;

  /**
   * A function that updates a document using the given parameters.
   */
  implementation: (doc: Doc, params: OperationParams, userId: string) => void;

  /**
   * The id of the operation to carry out.
   */
  operationId: string;

  /**
   * The parameters to be passed to the operation.
   */
  operationParams: OperationParams;

  /**
   * The parameters to be passed to the document store.
   */
  docStoreParams: DocStoreParams;

  /**
   * The required version of the document.  If specified, then this
   * property defines the version of the document that must be
   * found in the collection otherwise the operation will not be applied.
   */
  reqVersion?: string;

  /**
   * The id of the user that is making the request.
   */
  userId: string;

  /**
   * An array of field names to return after the request has completed.
   */
  fieldNames: (keyof Doc)[];
}
