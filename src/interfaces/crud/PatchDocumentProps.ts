import { PartialNullable } from "../generic/index.ts";

/**
 * Defines the properties that are required to patch a document.
 */
export interface PatchDocumentProps<Doc, DocStoreParams> {
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
   * The id of the operation.
   */
  operationId: string;

  /**
   * The patch to be applied.
   */
  patch: PartialNullable<Doc>;

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
}